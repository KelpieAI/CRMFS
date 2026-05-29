export interface PaymentAmountRow {
  due: number;
  paid: number;
  outstanding: number;
}

export interface MemberPaymentSummary {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  hasCompletedPayment: boolean;
}

export const PAYMENT_OVERDUE_DAYS = 30;

export type PaymentLike = {
  id?: string;
  payment_type?: string | null;
  payment_status?: string | null;
  total_amount?: number | string | null;
  payment_date?: string | null;
  created_at?: string | null;
};

export type MemberPaymentDisplayStatus =
  | { kind: 'clear' }
  | { kind: 'due'; outstanding: number }
  | { kind: 'failed'; outstanding: number };

/** Receipt rows log money received; they are not a new fee obligation. */
export function isReceiptPayment(payment: { payment_type?: string | null }): boolean {
  return payment.payment_type === 'receipt';
}

/** Registration, renewal, etc. — rows that establish an amount due. */
export function isObligationPayment(payment: { payment_type?: string | null }): boolean {
  return !isReceiptPayment(payment);
}

/** Open registration invoice (pending or failed after auto-pause — still the primary due). */
function getOpenRegistrationObligations(payments: PaymentLike[]): PaymentLike[] {
  return payments.filter(
    (p) =>
      isObligationPayment(p) &&
      p.payment_type === 'registration' &&
      (p.payment_status === 'pending' || p.payment_status === 'failed')
  );
}

function hasOpenRegistrationObligation(payments: PaymentLike[]): boolean {
  return getOpenRegistrationObligations(payments).length > 0;
}

/** Obligation rows that establish amount due (excludes mis-recorded payment rows). */
function getObligationsForSummary(payments: PaymentLike[]): PaymentLike[] {
  const obligations = payments.filter(isObligationPayment);
  const openRegs = getOpenRegistrationObligations(payments);

  if (openRegs.length > 0) {
    return openRegs;
  }

  return obligations.filter(
    (p) => !(p.payment_type === 'registration' && p.payment_status === 'completed')
  );
}

/**
 * Rows that count as money received (receipt type + legacy extra obligation rows
 * created when "Record Payment" incorrectly inserted a new due).
 */
function isPaymentReceivedRow(
  payment: PaymentLike,
  allPayments: PaymentLike[]
): boolean {
  if (isReceiptPayment(payment)) {
    return true;
  }
  if (!isObligationPayment(payment)) {
    return false;
  }
  if (!hasOpenRegistrationObligation(allPayments)) {
    return false;
  }
  const openRegs = getOpenRegistrationObligations(allPayments);
  const isPrimaryObligation = openRegs.some((r) => r.id === payment.id);
  return !isPrimaryObligation;
}

function amountReceivedOnRow(payment: PaymentLike): number {
  if (payment.payment_status === 'refunded' || payment.payment_status === 'failed') {
    return 0;
  }
  if (payment.payment_status === 'completed' || payment.payment_status === 'pending') {
    return Number(payment.total_amount || 0);
  }
  return 0;
}

/** Sum of money received across receipt / payment rows (uses `total_amount` per row). */
function getTotalAmountReceived(payments: PaymentLike[]): number {
  return payments
    .filter((p) => isPaymentReceivedRow(p, payments))
    .reduce((sum, p) => sum + amountReceivedOnRow(p), 0);
}

/** Member-level due / paid / outstanding across all payment rows. */
export function getMemberPaymentSummary(payments: PaymentLike[]): MemberPaymentSummary {
  const obligationsForDue = getObligationsForSummary(payments);
  const totalDue = obligationsForDue.reduce(
    (sum, p) => sum + Number(p.total_amount || 0),
    0
  );

  let totalPaid = getTotalAmountReceived(payments);

  if (totalPaid === 0 && !hasOpenRegistrationObligation(payments)) {
    totalPaid = obligationsForDue
      .filter((p) => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
  }

  const outstanding = Math.max(0, totalDue - totalPaid);

  return {
    totalDue,
    totalPaid,
    outstanding,
    hasCompletedPayment: totalPaid > 0,
  };
}

/** Internal allocation for activation / marking obligations complete. */
export function getPaymentAmounts(
  payment: PaymentLike,
  allPayments: PaymentLike[] = []
): PaymentAmountRow {
  if (isPaymentReceivedRow(payment, allPayments)) {
    const paid = Number(payment.total_amount || 0);
    return { due: 0, paid, outstanding: 0 };
  }

  const allocations = allocateObligationAmounts(allPayments);
  const row = payment.id ? allocations.get(payment.id) : undefined;

  if (row) {
    return row;
  }

  const due = Number(payment.total_amount || 0);
  const paid = payment.payment_status === 'completed' ? due : 0;
  return {
    due,
    paid,
    outstanding: payment.payment_status === 'refunded' ? 0 : Math.max(0, due - paid),
  };
}

/**
 * Per-row amounts for the payment history table.
 * - Primary obligation (e.g. registration invoice): full due, no paid on row, full outstanding on row.
 * - Payment received rows: reference due, amount paid on this row, remaining balance after all payments.
 */
export function getPaymentTableRowAmounts(
  payment: PaymentLike,
  allPayments: PaymentLike[] = []
): PaymentAmountRow {
  const summary = getMemberPaymentSummary(allPayments);

  if (isPaymentReceivedRow(payment, allPayments)) {
    const paid =
      payment.payment_status === 'completed' ||
      payment.payment_status === 'pending'
        ? Number(payment.total_amount || 0)
        : 0;
    return {
      due: summary.totalDue,
      paid,
      outstanding: summary.outstanding,
    };
  }

  const due = Number(payment.total_amount || 0);

  if (payment.payment_status === 'pending') {
    return { due, paid: 0, outstanding: due };
  }

  if (payment.payment_status === 'completed') {
    return { due, paid: due, outstanding: 0 };
  }

  if (payment.payment_status === 'refunded') {
    return { due, paid: 0, outstanding: 0 };
  }

  return { due, paid: 0, outstanding: due };
}

export function allocateObligationAmounts(
  payments: PaymentLike[]
): Map<string, PaymentAmountRow> {
  const map = new Map<string, PaymentAmountRow>();
  const obligationsForDue = getObligationsForSummary(payments);
  let receiptPool = getTotalAmountReceived(payments);

  const sorted = [...obligationsForDue].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return aTime - bTime;
  });

  for (const obligation of sorted) {
    if (!obligation.id) continue;
    const due = Number(obligation.total_amount || 0);

    if (obligation.payment_status === 'completed') {
      map.set(obligation.id, { due, paid: due, outstanding: 0 });
      continue;
    }

    const paid = Math.min(due, receiptPool);
    receiptPool -= paid;
    map.set(obligation.id, { due, paid, outstanding: Math.max(0, due - paid) });
  }

  return map;
}

export function sumPaymentAmounts(payments: PaymentLike[]): PaymentAmountRow {
  const summary = getMemberPaymentSummary(payments);
  return {
    due: summary.totalDue,
    paid: summary.totalPaid,
    outstanding: summary.outstanding,
  };
}

export function formatPaymentDateTime(payment: {
  payment_date?: string | null;
  created_at?: string | null;
}): string {
  const created = payment.created_at ? new Date(payment.created_at) : null;
  const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;
  const base = paymentDate || created;
  if (!base) return '—';

  const datePart = base.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (created) {
    const timePart = created.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart}, ${timePart}`;
  }

  return datePart;
}

export function formatPaymentReason(
  payment: {
    payment_type?: string | null;
    payment_status?: string | null;
    id?: string;
  },
  allPayments: PaymentLike[] = []
): string {
  if (isPaymentReceivedRow(payment, allPayments)) {
    return 'Payment received';
  }
  if (!payment.payment_type) return '—';
  return payment.payment_type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatPaymentMethod(method?: string | null): string {
  if (!method) return '—';
  return method
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatMoney(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

function getObligationIssueDate(payment: PaymentLike): Date {
  const raw = payment.payment_date || payment.created_at;
  return raw ? new Date(raw) : new Date(0);
}

/** True when any unpaid obligation is older than `days` from issue date. */
export function hasOverdueOutstanding(
  payments: PaymentLike[],
  days: number = PAYMENT_OVERDUE_DAYS
): boolean {
  const allocations = allocateObligationAmounts(payments);
  const thresholdMs = days * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const payment of payments) {
    if (!isObligationPayment(payment) || !payment.id) continue;
    const row = allocations.get(payment.id);
    if (!row || row.outstanding <= 0) continue;

    const issued = getObligationIssueDate(payment);
    if (now - issued.getTime() > thresholdMs) {
      return true;
    }
  }

  return false;
}

/** Header / badge label for member payment state. */
export function getMemberPaymentDisplayStatus(
  payments: PaymentLike[]
): MemberPaymentDisplayStatus {
  const summary = getMemberPaymentSummary(payments);

  if (summary.outstanding <= 0) {
    return { kind: 'clear' };
  }

  if (hasOverdueOutstanding(payments)) {
    return { kind: 'failed', outstanding: summary.outstanding };
  }

  return { kind: 'due', outstanding: summary.outstanding };
}

/** Obligation rows still pending after applying all receipts. */
export function getOutstandingObligations(payments: PaymentLike[]): PaymentLike[] {
  const allocations = allocateObligationAmounts(payments);
  return payments.filter((p) => {
    if (!isObligationPayment(p) || !p.id || p.payment_status !== 'pending') {
      return false;
    }
    const row = allocations.get(p.id);
    return row ? row.outstanding > 0 : true;
  });
}
