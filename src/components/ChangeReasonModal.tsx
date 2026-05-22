import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { FieldChange, formatValue } from '../hooks/useFormChangeTracker';

interface ChangeReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveWithReason: (reason: string) => void;
  changedFields: FieldChange[];
  memberName?: string;
  isSaving?: boolean;
}

export default function ChangeReasonModal({
  isOpen,
  onClose,
  onDiscard,
  onSaveWithReason,
  changedFields,
  memberName,
  isSaving = false,
}: ChangeReasonModalProps) {
  const [reason, setReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveWithReason(reason.trim());
  };

  const handleDiscard = () => {
    setReason('');
    onDiscard();
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Unsaved Changes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {memberName
                  ? `You have unsaved changes to ${memberName}'s record.`
                  : 'You have unsaved changes that will be lost.'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {changedFields.length} field{changedFields.length !== 1 ? 's' : ''} modified
            </button>

            {showDetails && (
              <div className="mt-3 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Field</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Before</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {changedFields.map((change, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {change.label}
                        </td>
                        <td className="px-3 py-2 text-red-600 line-through">
                          {formatValue(change.oldValue)}
                        </td>
                        <td className="px-3 py-2 text-green-600">
                          {formatValue(change.newValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="change-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for changes <span className="text-gray-400">(recommended for audit trail)</span>
            </label>
            <textarea
              id="change-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Corrected spelling error, Updated phone number per member request..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Helps with compliance and audit reviews</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={handleDiscard}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
