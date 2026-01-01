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
    <div className="w-56 bg-white border-r border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2.5 z-10">
        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Member Details
        </h2>
      </div>

      {/* Navigation Items */}
      <nav className="p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all duration-150
                ${isActive
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              
              {/* Count badge */}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                    ${isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
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

      {/* Quick Info Section (Optional) */}
      <div className="mt-3 px-3 py-2.5 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 font-medium mb-1.5">QUICK ACTIONS</p>
        <div className="space-y-1.5">
          <button 
            onClick={quickActions.onPrint || (() => window.print())}
            className="w-full text-left text-xs text-gray-600 hover:text-emerald-600 transition-colors flex items-center"
          >
            <Printer className="h-3 w-3 mr-2" />
            Print Summary
          </button>
          <button 
            onClick={quickActions.onExport}
            className="w-full text-left text-xs text-gray-600 hover:text-emerald-600 transition-colors flex items-center"
          >
            <Download className="h-3 w-3 mr-2" />
            Export Data
          </button>
          <button 
            onClick={quickActions.onEmail}
            className="w-full text-left text-xs text-gray-600 hover:text-emerald-600 transition-colors flex items-center"
          >
            <Mail className="h-3 w-3 mr-2" />
            Send Email
          </button>
          <button 
            onClick={quickActions.onDeleteRequest}
            className="w-full text-left text-xs text-red-600 hover:text-red-700 transition-colors flex items-center"
          >
            <Trash2 className="h-3 w-3 mr-2" />
            Create Deletion Request
          </button>
        </div>
      </div>
    </div>
  );
}