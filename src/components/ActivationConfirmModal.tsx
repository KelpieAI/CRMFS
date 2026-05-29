import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ActivationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  hasPendingPayments: boolean;
  pendingTotal: number;
  /** When set, activation is blocked until these requirements are met. */
  activationBlockers?: string[];
  isLoading?: boolean;
}

export function ActivationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  hasPendingPayments,
  pendingTotal,
  activationBlockers = [],
  isLoading,
}: ActivationConfirmModalProps) {
  if (!isOpen) return null;

  const cannotActivate =
    hasPendingPayments || activationBlockers.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-full ${cannotActivate ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {cannotActivate ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {cannotActivate ? 'Cannot Activate Member' : 'Confirm Activation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cannotActivate ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
            {hasPendingPayments && (
              <p className="text-sm font-semibold text-red-900">
                Outstanding balance of £{pendingTotal.toFixed(2)} remaining — record the full
                payment before activating.
              </p>
            )}
            {activationBlockers.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Requirements not met:
                </p>
                <ul className="text-sm text-red-800 list-disc list-inside space-y-0.5">
                  {activationBlockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
            {cannotActivate ? 'Close' : 'Cancel'}
          </button>
          {!cannotActivate && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 transition-colors bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? 'Activating...' : 'Confirm Activation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
