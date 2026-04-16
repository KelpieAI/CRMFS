import {
  User,
  Baby,
  Heart,
  Stethoscope,
  CreditCard,
  ArrowLeft,
  Mail,
  Printer,
  Hash,
  Save,
  FolderOpen,
} from 'lucide-react';

interface RegistrationSidebarProps {
  currentStep: number;
  completedSteps: number[];
  onStepChange: (step: number) => void;
  onSaveProgress?: () => void;
  onBack?: () => void;
  onSendCopy?: () => void;
  onPrintProgress?: () => void;
  applicationReference?: string | null;
  isSaving?: boolean;
  appType?: 'single' | 'joint';
}

export default function RegistrationSidebar({
  currentStep,
  completedSteps,
  onStepChange,
  onSaveProgress,
  onBack,
  onSendCopy,
  onPrintProgress,
  applicationReference,
  isSaving,
  appType = 'single',
}: RegistrationSidebarProps) {
  const singleSteps = [
    { id: 1, label: 'Membership Type', icon: User },
    { id: 2, label: 'Main Member', icon: User },
    { id: 3, label: 'Children', icon: Baby },
    { id: 4, label: 'Next of Kin', icon: Heart },
    { id: 5, label: 'Medical Info', icon: Stethoscope },
    { id: 6, label: 'GP Details', icon: Stethoscope },
    { id: 7, label: 'Documents', icon: FolderOpen },
    { id: 8, label: 'Payment', icon: CreditCard },
  ];

  const jointSteps = [
    { id: 1, label: 'Membership Type', icon: User },
    { id: 2, label: 'Main Member', icon: User },
    { id: 3, label: 'Joint Member', icon: User },
    { id: 4, label: 'Children', icon: Baby },
    { id: 5, label: 'Next of Kin', icon: Heart },
    { id: 6, label: 'Medical Info', icon: Stethoscope },
    { id: 7, label: 'GP Details', icon: Stethoscope },
    { id: 8, label: 'Documents', icon: FolderOpen },
    { id: 9, label: 'Payment', icon: CreditCard },
  ];

  const steps = appType === 'joint' ? jointSteps : singleSteps;

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col transition-colors">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 px-5 py-4 border-b-2 border-[#2d5016] transition-colors">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Registration Steps
        </h2>
        {applicationReference && (
          <div className="mt-2 flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
              {applicationReference}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const isActive = status === 'active';
            const isCompleted = status === 'completed';
            const isPending = status === 'pending';

            return (
              <button
                key={step.id}
                onClick={() => isCompleted && onStepChange(step.id)}
                disabled={isPending}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                  group relative
                  ${isActive
                    ? 'bg-emerald-50 dark:bg-gray-800 text-[#2d5016] dark:text-emerald-400 font-semibold border-l-3 border-l-[#2d5016] pl-3.5'
                    : isCompleted
                    ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-l-3 hover:border-l-[#D4AF37] hover:pl-3.5 cursor-pointer'
                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                      ${isCompleted
                        ? 'bg-[#10b981] text-white'
                        : isActive
                        ? 'bg-[#2d5016] text-white'
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : step.id}
                  </div>
                  <span className="text-[15px]">{step.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5 my-5 border-t border-gray-200 dark:border-gray-800"></div>

        {/* Quick Actions Section */}
        <div className="px-5 pb-6">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="space-y-2.5">
            <button
              onClick={onSaveProgress}
              disabled={isSaving}
              className="w-full text-left text-[13px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-semibold disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={onBack}
              className="w-full text-left text-[13px] text-gray-600 dark:text-gray-300 hover:text-[#2d5016] dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </button>
            <button
              onClick={onSendCopy}
              className="w-full text-left text-[13px] text-gray-600 dark:text-gray-300 hover:text-[#2d5016] dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
            >
              <Mail className="h-4 w-4" />
              Email Copy
            </button>
            <button
              onClick={onPrintProgress}
              className="w-full text-left text-[13px] text-gray-600 dark:text-gray-300 hover:text-[#2d5016] dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
            >
              <Printer className="h-4 w-4" />
              Print Progress
            </button>
          </div>
        </div>

        {/* Auto-save indicator */}
        {applicationReference && (
          <div className="px-5 pb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-saving enabled
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
