import {
  User,
  Users,
  Baby,
  Heart,
  Stethoscope,
  FileText,
  Upload,
  CheckSquare,
  CreditCard,
  Save,
  ArrowLeft,
  Mail,
  Printer,
} from 'lucide-react';

interface RegistrationSidebarProps {
  currentStep: number;
  completedSteps: number[];
  onStepChange: (step: number) => void;
  onSaveProgress?: () => void;
  onBack?: () => void;
  onSendCopy?: () => void;
  onPrintProgress?: () => void;
}

export default function RegistrationSidebar({
  currentStep,
  completedSteps,
  onStepChange,
  onSaveProgress,
  onBack,
  onSendCopy,
  onPrintProgress,
}: RegistrationSidebarProps) {
  const steps = [
    { id: 1, label: 'Membership Type', icon: User },
    { id: 2, label: 'Main Member', icon: User },
    { id: 3, label: 'Children', icon: Baby },
    { id: 4, label: 'Next of Kin', icon: Heart },
    { id: 5, label: 'Medical Info', icon: Stethoscope },
    { id: 6, label: 'Documents', icon: Upload },
    { id: 7, label: 'Declarations', icon: CheckSquare },
    { id: 8, label: 'GDPR Compliance', icon: FileText },
    { id: 9, label: 'Payment', icon: CreditCard },
  ];

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-5 py-4 border-b-2 border-[#2d5016]">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Registration Steps
        </h2>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {steps.map((step) => {
            const Icon = step.icon;
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
                    ? 'bg-emerald-50 text-[#2d5016] font-semibold border-l-3 border-l-[#2d5016] pl-3.5'
                    : isCompleted
                    ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-l-3 hover:border-l-[#D4AF37] hover:pl-3.5 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed opacity-50'
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
        <div className="mx-5 my-5 border-t border-gray-200"></div>

        {/* Quick Actions Section */}
        <div className="px-5 pb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="space-y-2.5">
            <button
              onClick={onSaveProgress}
              className="w-full text-left text-[13px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-semibold"
            >
              <Save className="h-4 w-4" />
              Save Progress
            </button>
            <button
              onClick={onBack}
              className="w-full text-left text-[13px] text-gray-600 hover:text-[#2d5016] hover:bg-gray-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </button>
            <button
              onClick={onSendCopy}
              className="w-full text-left text-[13px] text-gray-600 hover:text-[#2d5016] hover:bg-gray-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
            >
              <Mail className="h-4 w-4" />
              Email Copy
            </button>
            <button
              onClick={onPrintProgress}
              className="w-full text-left text-[13px] text-gray-600 hover:text-[#2d5016] hover:bg-gray-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
            >
              <Printer className="h-4 w-4" />
              Print Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
