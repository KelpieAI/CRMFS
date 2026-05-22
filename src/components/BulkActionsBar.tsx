import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  CheckSquare, Square, X, Eye, CheckCircle2,
  PauseCircle, Trash2, Download, AlertTriangle,
  XCircle, Lock,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { checkOutstandingPayments } from '../lib/activationHelpers';
import { ActivationConfirmModal } from './ActivationConfirmModal';

interface Member {
  id: string;
  status: string;
  first_name: string;
  last_name: string;
}

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  allIds: string[];
  members: Member[];
  onClearSelection: () => void;
  onSelectAll: () => void;
}

interface MissingRequirements {
  payment: boolean;
  documents: boolean;
}

async function canActivateMember(memberId: string): Promise<{ canActivate: boolean; missingRequirements: MissingRequirements }> {
  const [{ data: payments }, { data: member }] = await Promise.all([
    supabase
      .from('payments')
      .select('payment_status')
      .eq('member_id', memberId)
      .eq('payment_status', 'completed')
      .limit(1),
    supabase
      .from('members')
      .select('main_photo_id_url, main_proof_address_url')
      .eq('id', memberId)
      .maybeSingle(),
  ]);

  const hasPayment = !!(payments && payments.length > 0);
  const hasDocuments = !!(member?.main_photo_id_url && member?.main_proof_address_url);

  return {
    canActivate: hasPayment && hasDocuments,
    missingRequirements: {
      payment: !hasPayment,
      documents: !hasDocuments,
    },
  };
}

export function BulkActionsBar({
  selectedIds,
  allIds,
  members,
  onClearSelection,
  onSelectAll,
}: BulkActionsBarProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showCannotActivateModal, setShowCannotActivateModal] = useState(false);
  const [missingReqs, setMissingReqs] = useState<MissingRequirements>({ payment: false, documents: false });
  const [showActivationConfirm, setShowActivationConfirm] = useState(false);
  const [activationPendingTotal, setActivationPendingTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);

  const selectedCount = selectedIds.size;
  const isSingle = selectedCount === 1;
  const isAllSelected = selectedCount === allIds.length && allIds.length > 0;

  const selectedMember = isSingle
    ? members.find((m) => m.id === Array.from(selectedIds)[0])
    : null;

  const isCurrentlyActive = selectedMember?.status === 'active';
  const isCurrentlyPaused = selectedMember?.status === 'paused' || selectedMember?.status === 'inactive';
  const isMultiple = selectedCount > 1;

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .update({ status: 'paused' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClearSelection();
      showToast('Member paused successfully', 'success');
    },
    onError: () => showToast('Failed to pause member', 'error'),
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClearSelection();
      showToast('Member activated successfully', 'success');
    },
    onError: () => showToast('Failed to activate member', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('children').delete().eq('member_id', id);
      await supabase.from('next_of_kin').delete().eq('member_id', id);
      await supabase.from('joint_members').delete().eq('member_id', id);
      await supabase.from('medical_info').delete().eq('member_id', id);
      await supabase.from('gp_details').delete().eq('member_id', id);
      await supabase.from('declarations').delete().eq('member_id', id);

      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('activity_log').insert({
        action: 'member_deleted',
        entity_type: 'member',
        entity_id: id,
        performed_by: user.id,
        details: { deletion_reason: reason, deleted_by: user.email },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClearSelection();
      setShowDeleteModal(false);
      setDeleteReason('');
      setDeletePassword('');
      setDeleteError('');
      showToast('Member permanently deleted', 'success');
    },
    onError: (err: any) => {
      setDeleteError(err.message || 'Deletion failed. Please try again.');
    },
  });

  const handleActivate = async () => {
    if (!selectedMember) return;
    setIsCheckingActivation(true);
    try {
      const result = await canActivateMember(selectedMember.id);
      if (!result.canActivate) {
        setMissingReqs(result.missingRequirements);
        setShowCannotActivateModal(true);
      } else {
        const { pendingTotal } = await checkOutstandingPayments(selectedMember.id);
        setActivationPendingTotal(pendingTotal);
        setShowActivationConfirm(true);
      }
    } finally {
      setIsCheckingActivation(false);
    }
  };

  const handlePause = () => {
    if (!selectedMember) return;
    pauseMutation.mutate(selectedMember.id);
  };

  const handleExport = async () => {
    const { data: exportMembers } = await supabase
      .from('members')
      .select('*')
      .in('id', Array.from(selectedIds));

    if (!exportMembers) return;

    const headers = ['Name', 'Email', 'Phone', 'Status', 'Join Date'];
    const rows = exportMembers.map((m) => [
      `${m.first_name} ${m.last_name}`,
      m.email,
      m.mobile,
      m.status,
      new Date(m.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteSubmit = async () => {
    setDeleteError('');

    if (!deleteReason.trim()) {
      setDeleteError('A reason is required to delete a member.');
      return;
    }
    if (!deletePassword.trim()) {
      setDeleteError('Your password is required to confirm deletion.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setDeleteError('Could not verify current user.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (signInError) {
      setDeleteError('Incorrect password. Please try again.');
      return;
    }

    const memberId = Array.from(selectedIds)[0];
    deleteMutation.mutate({ id: memberId, reason: deleteReason });
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3.5 flex items-center space-x-5">
          {/* Selection info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="h-5 w-5 text-emerald-400" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="text-sm font-semibold">
                {selectedCount} {selectedCount === 1 ? 'member' : 'members'} selected
              </span>
            </button>
            <button
              onClick={onClearSelection}
              className="p-1 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-700" />

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <ActionButton
              icon={<Eye className="h-4 w-4" />}
              label="View"
              disabled={isMultiple}
              disabledReason="Select only one member to view"
              onClick={() => {
                if (selectedMember) navigate(`/members/${selectedMember.id}`);
              }}
            />

            <ActionButton
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              label="Activate"
              disabled={isMultiple || isCurrentlyActive}
              disabledReason={
                isMultiple
                  ? 'Select only one member to activate'
                  : 'Member is already active'
              }
              loading={isCheckingActivation || activateMutation.isPending}
              onClick={handleActivate}
            />

            <ActionButton
              icon={<PauseCircle className="h-4 w-4 text-orange-400" />}
              label="Pause"
              disabled={isMultiple || isCurrentlyPaused || selectedMember?.status === 'pending'}
              disabledReason={
                isMultiple
                  ? 'Select only one member to pause'
                  : isCurrentlyPaused
                  ? 'Member is already paused'
                  : 'Cannot pause a pending member'
              }
              loading={pauseMutation.isPending}
              onClick={handlePause}
            />

            <ActionButton
              icon={<Download className="h-4 w-4" />}
              label="Export"
              onClick={handleExport}
            />

            {isSingle && (
              <>
                <div className="h-6 w-px bg-gray-700 mx-1" />
                <ActionButton
                  icon={<Trash2 className="h-4 w-4 text-red-400" />}
                  label="Delete"
                  danger
                  onClick={() => {
                    setDeleteReason('');
                    setDeletePassword('');
                    setDeleteError('');
                    setShowDeleteModal(true);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <ActivationConfirmModal
        isOpen={showActivationConfirm}
        onClose={() => setShowActivationConfirm(false)}
        onConfirm={() => {
          setShowActivationConfirm(false);
          if (selectedMember) activateMutation.mutate(selectedMember.id);
        }}
        memberName={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : ''}
        hasPendingPayments={activationPendingTotal > 0}
        pendingTotal={activationPendingTotal}
        isLoading={activateMutation.isPending}
      />

      {/* Cannot Activate Modal */}
      {showCannotActivateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cannot Activate Member</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This member cannot be activated. The following requirements are missing:
            </p>
            <ul className="space-y-2 mb-6">
              {missingReqs.payment && (
                <li className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Payment not received — no completed payment on record</span>
                </li>
              )}
              {missingReqs.documents && (
                <li className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Documents not uploaded — Photo ID and Proof of Address required</span>
                </li>
              )}
            </ul>
            <button
              onClick={() => setShowCannotActivateModal(false)}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 mb-1">
              <div className="p-2.5 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Member — Permanent Action</h3>
                <p className="text-sm text-gray-500">
                  {selectedMember.first_name} {selectedMember.last_name}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg mb-5">
              <p className="text-sm text-red-800 font-medium">
                This action cannot be undone. All member data, payments, and documents will be permanently deleted.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Enter reason for deletion (e.g., Duplicate record, Member requested removal, Deceased record moved...)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{deleteReason.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="h-3.5 w-3.5 inline mr-1" />
                  Enter your password to confirm <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your account password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {deleteError && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteMutation.isPending || !deleteReason.trim() || !deletePassword.trim()}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

function ActionButton({
  icon,
  label,
  disabled,
  disabledReason,
  loading,
  danger,
  onClick,
}: ActionButtonProps) {
  const base = 'relative group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm transition-all select-none';
  const enabledCls = danger
    ? 'hover:bg-red-900/60 cursor-pointer text-red-300 hover:text-red-200'
    : 'hover:bg-gray-700 cursor-pointer text-gray-100';
  const disabledCls = 'opacity-40 cursor-not-allowed text-gray-400';

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`${base} ${disabled || loading ? disabledCls : enabledCls}`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        icon
      )}
      <span>{label}</span>

      {disabled && disabledReason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
          {disabledReason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </button>
  );
}
