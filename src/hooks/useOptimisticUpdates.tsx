// src/hooks/useOptimisticUpdates.ts
// Instant UI feedback - no waiting for server!

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ============================================
// 1. OPTIMISTIC MEMBER STATUS UPDATE
// ============================================

export function useMemberStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, newStatus }: { memberId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;
    },

    // BEFORE server responds - update UI immediately!
    onMutate: async ({ memberId, newStatus }) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['members'] });
      await queryClient.cancelQueries({ queryKey: ['member-detail', memberId] });

      // Save current state for rollback
      const previousMembers = queryClient.getQueryData(['members']);
      const previousMember = queryClient.getQueryData(['member-detail', memberId]);

      // Optimistically update members list
      queryClient.setQueryData(['members'], (old: any) => {
        if (!old) return old;
        return old.map((m: any) =>
          m.id === memberId ? { ...m, status: newStatus } : m
        );
      });

      // Optimistically update member detail
      queryClient.setQueryData(['member-detail', memberId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          member: { ...old.member, status: newStatus },
        };
      });

      // Return context for rollback
      return { previousMembers, previousMember };
    },

    // If mutation fails, rollback
    onError: (_err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['members'], context.previousMembers);
      }
      if (context?.previousMember) {
        queryClient.setQueryData(['member-detail', variables.memberId], context.previousMember);
      }
    },

    // After success, refetch to sync with server
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', variables.memberId] });
    },
  });
}

// ============================================
// 2. OPTIMISTIC MEMBER DELETE
// ============================================

export function useOptimisticDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },

    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: ['members'] });

      const previousMembers = queryClient.getQueryData(['members']);

      // Remove from list immediately
      queryClient.setQueryData(['members'], (old: any) => {
        return old ? old.filter((m: any) => m.id !== memberId) : old;
      });

      return { previousMembers };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['members'], context.previousMembers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

// ============================================
// 3. OPTIMISTIC PAYMENT STATUS UPDATE
// ============================================

export function usePaymentStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, newStatus }: { paymentId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('payments')
        .update({ payment_status: newStatus })
        .eq('id', paymentId);

      if (error) throw error;
    },

    onMutate: async ({ paymentId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['payments'] });

      const previousPayments = queryClient.getQueryData(['payments']);

      queryClient.setQueryData(['payments'], (old: any) => {
        if (!old) return old;
        return old.map((p: any) =>
          p.id === paymentId ? { ...p, payment_status: newStatus } : p
        );
      });

      return { previousPayments };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(['payments'], context.previousPayments);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// ============================================
// HOW TO USE IN COMPONENTS
// ============================================

/*
// In MemberDetail.tsx or MemberCard.tsx:

import { useMemberStatusUpdate } from '../hooks/useOptimisticUpdates';

function MemberActions({ member }) {
  const updateStatus = useMemberStatusUpdate();

  const handlePause = () => {
    updateStatus.mutate({
      memberId: member.id,
      newStatus: 'paused',
    });
    // UI updates INSTANTLY! No waiting!
  };

  const handleActivate = () => {
    updateStatus.mutate({
      memberId: member.id,
      newStatus: 'active',
    });
  };

  return (
    <>
      <button
        onClick={handlePause}
        disabled={updateStatus.isPending}
        className="..."
      >
        {updateStatus.isPending ? 'Pausing...' : 'Pause'}
      </button>

      <button
        onClick={handleActivate}
        disabled={updateStatus.isPending}
        className="..."
      >
        {updateStatus.isPending ? 'Activating...' : 'Activate'}
      </button>
    </>
  );
}
*/