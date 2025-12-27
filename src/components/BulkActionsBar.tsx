// ============================================
// BULK ACTIONS SYSTEM
// Select multiple members and perform batch operations
// ============================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { CheckSquare, Square, Trash2, Mail, Download, PlayCircle, PauseCircle } from 'lucide-react';

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  allIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export function BulkActionsBar({
  selectedIds,
  allIds,
  onClearSelection,
  onSelectAll,
}: BulkActionsBarProps) {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const selectedCount = selectedIds.size;
  const isAllSelected = selectedCount === allIds.length && allIds.length > 0;

  // Bulk update status mutation
  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('members')
        .update({ status: status })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClearSelection();
    },
  });

  // Bulk delete mutation
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClearSelection();
      setShowConfirm(null);
    },
  });

  // Bulk export
  const handleExport = async () => {
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .in('id', Array.from(selectedIds));

    if (!members) return;

    // Convert to CSV
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Join Date'];
    const rows = members.map(m => [
      `${m.first_name} ${m.last_name}`,
      m.email,
      m.mobile,
      m.status,
      new Date(m.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center space-x-6">
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
            </button>

            <button
              onClick={onClearSelection}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-700" />

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Pause Members */}
            <button
              onClick={() => bulkUpdateStatus.mutate({
                ids: Array.from(selectedIds),
                status: 'inactive',
              })}
              disabled={bulkUpdateStatus.isPending}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Pause selected members"
            >
              <PauseCircle className="h-4 w-4" />
              <span className="text-sm">Pause</span>
            </button>

            {/* Activate Members */}
            <button
              onClick={() => bulkUpdateStatus.mutate({
                ids: Array.from(selectedIds),
                status: 'active',
              })}
              disabled={bulkUpdateStatus.isPending}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Activate selected members"
            >
              <PlayCircle className="h-4 w-4" />
              <span className="text-sm">Activate</span>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>

            {/* Email (Future) */}
            <button
              onClick={() => alert('Email feature coming soon!')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              title="Send bulk email"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">Email</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-700 mx-2" />

            {/* Delete */}
            <button
              onClick={() => setShowConfirm('delete')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-red-900 transition-colors text-red-400 hover:text-red-300"
              title="Delete selected members"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm === 'delete' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {selectedCount} Member{selectedCount > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. All data for these members will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => bulkDelete.mutate(Array.from(selectedIds))}
                disabled={bulkDelete.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {bulkDelete.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

