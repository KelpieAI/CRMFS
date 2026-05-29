import { supabase } from './supabase';
import { getMemberPaymentSummary } from './paymentDisplay';

export interface ActivationCheck {
  hasPendingPayments: boolean;
  pendingTotal: number;
}

export async function checkOutstandingPayments(memberId: string): Promise<ActivationCheck> {
  const { data } = await supabase
    .from('payments')
    .select('id, payment_type, payment_status, total_amount, created_at')
    .eq('member_id', memberId);

  const summary = getMemberPaymentSummary(data || []);

  return {
    hasPendingPayments: summary.outstanding > 0,
    pendingTotal: summary.outstanding,
  };
}
