import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Heart,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CollapsibleSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Members', to: '/members', icon: Users },
    { name: 'Payments', to: '/payments', icon: CreditCard },
    { name: 'Deceased', to: '/deceased', icon: Heart },
    { name: 'Reports', to: '/reports', icon: FileText },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Handle hover expansion on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const hoverZoneWidth = window.innerWidth * 0.05;
      if (e.clientX <= hoverZoneWidth) {
        setIsExpanded(true);
      } else if (e.clientX > 250) {
        setIsExpanded(false);
      }
    };

    if (window.innerWidth >= 768) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu]);

  const getInitial = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user?.email) return 'User';
    return user.email.split('@')[0];
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-mosque-green-600 text-white rounded-lg shadow-lg hover:bg-mosque-green-700 transition-colors"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-mosque-green-600 text-white z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center border-b border-mosque-green-700 overflow-hidden flex-shrink-0">
          <div className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
            <div className="px-4 py-2">
              <h1 className="text-lg font-bold text-mosque-gold-500 whitespace-nowrap">Kelpie AI</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap">CRMFS</p>
            </div>
          </div>
          <div className={`transition-opacity duration-200 ${!isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mosque-gold-500 to-mosque-gold-700 flex items-center justify-center font-bold text-white">
              K
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.name}
                to={item.to}
                className={`
                  relative flex items-center rounded-lg transition-all duration-200 overflow-hidden
                  ${isActive
                    ? 'bg-mosque-gold-600 text-white'
                    : 'text-gray-300 hover:bg-mosque-green-700 hover:text-white'
                  }
                  pl-3 pr-3 py-3
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0 relative z-10" />
                <span 
                  className={`
                    font-medium whitespace-nowrap transition-all duration-200 ml-3
                    ${isExpanded ? 'opacity-100' : 'opacity-0'}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Section at Bottom */}
        <div className="border-t border-mosque-green-700 p-2 mt-auto flex-shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
            }}
            className="w-full flex items-center px-3 py-3 text-white hover:bg-mosque-green-700 rounded-lg transition-colors relative"
          >
            {/* Profile Picture */}
            <div className="w-10 h-10 rounded-full bg-mosque-gold-500 flex items-center justify-center text-mosque-green-900 font-bold text-sm flex-shrink-0">
              {getInitial()}
            </div>
            
            {/* Name (show when expanded) */}
            <div 
              className={`
                ml-3 flex-1 text-left transition-all duration-200
                ${isExpanded ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <p className="text-sm font-medium text-white truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-mosque-green-200">
                Committee Member
              </p>
            </div>
            
            {/* Dropdown Icon */}
            <ChevronDown 
              className={`
                h-4 w-4 text-mosque-green-200 transition-all duration-200
                ${showProfileMenu ? 'rotate-180' : ''}
                ${isExpanded ? 'opacity-100' : 'opacity-0'}
              `}
            />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div 
              className={`absolute ${isExpanded ? 'left-2 right-2 bottom-full' : 'left-16 bottom-2'} mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <Settings className="h-4 w-4 mr-3 text-gray-500" />
                Settings
              </button>
              
              <button
                onClick={() => {
                  handleSignOut();
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for collapsed sidebar on desktop */}
      <div className="hidden md:block w-16" />
    </>
  );
}