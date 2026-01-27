// ==============================================================================
// REPLACE THE ENTIRE MemberSubNav.tsx FILE WITH THIS
// ==============================================================================

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
  Activity,
  Printer,
  Download,
  Mail,
  Trash2,
} from 'lucide-react';

interface MemberSubNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: {
    children?: number;
    documents?: number;
    payments?: number;
  };
  showJointMember?: boolean;
  quickActions?: {
    onPrint?: () => void;
    onExport?: () => void;
    onEmail?: () => void;
    onDeleteRequest?: () => void;
  };
}

export default function MemberSubNav({
  activeTab,
  onTabChange,
  counts = {},
  showJointMember = false,
  quickActions = {},
}: MemberSubNavProps) {
  const navItems = [
    { id: 'personal', label: 'Personal Info', icon: User, show: true },
    { id: 'joint', label: 'Joint Member', icon: Users, show: showJointMember },
    { id: 'children', label: 'Children', icon: Baby, show: true, count: counts.children },
    { id: 'nok', label: 'Next of Kin', icon: Heart, show: true },
    { id: 'gp', label: 'GP Details', icon: Stethoscope, show: true },
    { id: 'medical', label: 'Medical Info', icon: FileText, show: true },
    { id: 'documents', label: 'Documents', icon: Upload, show: true, count: counts.documents },
    { id: 'declarations', label: 'Declarations', icon: CheckSquare, show: true },
    { id: 'payments', label: 'Payments', icon: CreditCard, show: true, count: counts.payments },
    { id: 'activity', label: 'Activity Log', icon: Activity, show: true },
  ].filter(item => item.show);

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white px-5 py-6 z-10 border-b-2 border-[#2d5016]">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Member Details
        </h2>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                group relative
                ${isActive
                  ? 'bg-emerald-50 text-[#2d5016] font-semibold border-l-3 border-l-[#2d5016] pl-3.5'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-l-3 hover:border-l-[#D4AF37] hover:pl-3.5'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-[18px] w-[18px] transition-colors ${
                    isActive ? 'text-[#2d5016]' : 'text-gray-400 group-hover:text-[#D4AF37]'
                  }`}
                />
                <span className="text-[15px]">{item.label}</span>
              </div>

              {/* Count badge */}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[24px] h-5 px-2 text-xs font-bold rounded-full
                    ${isActive
                      ? 'bg-[#2d5016] text-white'
                      : 'bg-gray-200 text-gray-700 group-hover:bg-[#D4AF37] group-hover:text-white'
                    }
                  `}
                >
                  {item.count}
                </span>
              )}
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
            onClick={quickActions.onPrint || (() => window.print())}
            className="w-full text-left text-[13px] text-gray-600 hover:text-[#2d5016] hover:bg-gray-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
          >
            <Printer className="h-4 w-4" />
            Print Summary
          </button>
          <button
            onClick={quickActions.onExport}
            className="w-full text-left text-[13px] text-gray-600 hover:text-[#2d5016] hover:bg-gray-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={quickActions.onEmail}
            className="w-full text-left text-[13px] text-gray-600 hover:text-[#2d5016] hover:bg-gray-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </button>
          <button
            onClick={quickActions.onDeleteRequest}
            className="w-full text-left text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 transition-all py-2.5 px-3 rounded-lg flex items-center gap-2.5 font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Delete Request
          </button>
        </div>
      </div>
    </div>
  );
}
