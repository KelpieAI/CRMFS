import { supabase } from './supabase';
import {
  allocateObligationAmounts,
  getMemberPaymentDisplayStatus,
  hasOverdueOutstanding,
  isObligationPayment,
  PAYMENT_OVERDUE_DAYS,
  type PaymentLike,
} from './paymentDisplay';

function getObligationIssueDate(payment: PaymentLike): Date {
  const raw = payment.payment_date || payment.created_at;
  return raw ? new Date(raw) : new Date(0);
}

export function buildLatePaymentPausedReason(warningCount: number): string {
  const count = Math.max(0, warningCount);
  return `Late payment - ${count} warning${count === 1 ? '' : 's'} issued`;
}

export interface OverdueEnforcementResult {
  changed: boolean;
  memberPaused: boolean;
  paymentsMarkedFailed: number;
}

/**
 * When outstanding obligations are 30+ days old: mark them failed and pause membership
 * (same as manual / renewal late-payment suspension — not inactive).
 */
export async function enforceOverduePaymentRules(
  memberId: string,
  member: {
    status: string;
    late_warnings_count?: number | null;
    paused_reason?: string | null;
  },
  payments: PaymentLike[]
): Promise<OverdueEnforcementResult> {
  const display = getMemberPaymentDisplayStatus(payments);
  if (display.kind !== 'failed' || !hasOverdueOutstanding(payments, PAYMENT_OVERDUE_DAYS)) {
    return { changed: false, memberPaused: false, paymentsMarkedFailed: 0 };
  }

  let changed = false;
  let paymentsMarkedFailed = 0;

  const allocations = allocateObligationAmounts(payments);
  const thresholdMs = PAYMENT_OVERDUE_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const payment of payments) {
    if (!isObligationPayment(payment) || !payment.id) continue;
    const row = allocations.get(payment.id);
    if (!row || row.outstanding <= 0) continue;

    const issued = getObligationIssueDate(payment);
    if (now - issued.getTime() <= thresholdMs) continue;

    if (payment.payment_status === 'pending') {
      const { error } = await supabase
        .from('payments')
        .update({ payment_status: 'failed' })
        .eq('id', payment.id);
      if (!error) {
        paymentsMarkedFailed += 1;
        changed = true;
      }
    }
  }

  const warningCount = member.late_warnings_count ?? 0;
  const pausedReason = buildLatePaymentPausedReason(warningCount);

  const shouldPause =
    member.status === 'active' ||
    member.status === 'pending' ||
    member.status === 'inactive';

  let memberPaused = false;
  if (shouldPause) {
    const { error } = await supabase
      .from('members')
      .update({
        status: 'paused',
        paused_date: new Date().toISOString(),
        paused_reason: pausedReason,
      })
      .eq('id', memberId);
    if (!error) {
      memberPaused = true;
      changed = true;
    }
  } else if (member.status === 'paused' && !member.paused_reason) {
    const { error } = await supabase
      .from('members')
      .update({ paused_reason: pausedReason })
      .eq('id', memberId);
    if (!error) {
      changed = true;
    }
  }

  return { changed, memberPaused, paymentsMarkedFailed };
}

/** Increment late payment warning counter after a warning email is sent. */
export async function incrementLatePaymentWarnings(
  memberId: string
): Promise<number> {
  const { data: member, error: fetchError } = await supabase
    .from('members')
    .select('late_warnings_count, status')
    .eq('id', memberId)
    .single();

  if (fetchError) throw fetchError;

  const nextCount = (member?.late_warnings_count ?? 0) + 1;

  const updates: {
    late_warnings_count: number;
    paused_reason?: string;
  } = { late_warnings_count: nextCount };

  if (member?.status === 'paused') {
    updates.paused_reason = buildLatePaymentPausedReason(nextCount);
  }

  const { error: updateError } = await supabase
    .from('members')
    .update(updates)
    .eq('id', memberId);

  if (updateError) throw updateError;

  return nextCount;
}
