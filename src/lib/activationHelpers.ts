import { supabase } from './supabase';

export interface ActivationCheck {
  hasPendingPayments: boolean;
  pendingTotal: number;
}

export async function checkOutstandingPayments(memberId: string): Promise<ActivationCheck> {
  const { data } = await supabase
    .from('payments')
    .select('total_amount, payment_status')
    .eq('member_id', memberId)
    .eq('payment_status', 'pending');

  const pendingTotal = (data || []).reduce((sum, p) => sum + Number(p.total_amount), 0);

  return {
    hasPendingPayments: pendingTotal > 0,
    pendingTotal,
  };
}
