import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ActivationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  hasPendingPayments: boolean;
  pendingTotal: number;
  isLoading?: boolean;
}

export function ActivationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  hasPendingPayments,
  pendingTotal,
  isLoading,
}: ActivationConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-full ${hasPendingPayments ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {hasPendingPayments ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {hasPendingPayments ? 'Outstanding Payments' : 'Confirm Activation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasPendingPayments ? (
          <>
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                {memberName} has an outstanding balance of £{pendingTotal.toFixed(2)}
              </p>
              <p className="text-sm text-amber-800">
                This member has pending payments that have not been cleared. Activating a membership with an outstanding balance will subject this member to the late payment process.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to activate this membership despite the outstanding balance?
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 mb-6">
            Confirm you want to set <span className="font-semibold text-gray-900">{memberName}</span> to <span className="font-semibold text-emerald-700">Active</span>. All payment requirements are met.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 transition-colors ${
              hasPendingPayments
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Activating...' : hasPendingPayments ? 'Activate Anyway' : 'Confirm Activation'}
          </button>
        </div>
      </div>
    </div>
  );
}
