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
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type SidebarMode = 'hover' | 'expanded' | 'collapsed';

export default function CollapsibleSidebar() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('hover');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem('sidebarMode') as SidebarMode;
    if (savedMode) {
      setSidebarMode(savedMode);
      if (savedMode === 'expanded') {
        setIsExpanded(true);
      } else if (savedMode === 'collapsed') {
        setIsExpanded(false);
      }
    }
  }, []);

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
    if (sidebarMode !== 'hover') return;

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
  }, [sidebarMode]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
      if (showSidebarMenu) {
        setShowSidebarMenu(false);
      }
    };

    if (showProfileMenu || showSidebarMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu, showSidebarMenu]);

  const handleSidebarModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode);
    localStorage.setItem('sidebarMode', mode);

    if (mode === 'expanded') {
      setIsExpanded(true);
    } else if (mode === 'collapsed') {
      setIsExpanded(false);
    }

    setShowSidebarMenu(false);
  };

  const getInitial = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getRoleLabel = () => {
    if (!profile?.role) return 'Committee Member';
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      chairman: 'Chairman',
      treasurer: 'Treasurer',
      developer: 'Developer',
    };
    return roleMap[profile.role] || 'Committee Member';
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
        className={'fixed top-0 left-0 h-full bg-mosque-green-600 text-white z-40 transition-all duration-300 ease-in-out flex flex-col ' +
          (isExpanded ? 'w-64' : 'w-16') + ' ' +
          (isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')}
        onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center border-b border-mosque-green-700 overflow-hidden flex-shrink-0">
          {/* K avatar - always at fixed left position via w-16 container */}
          <div className="w-16 flex items-center justify-center flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mosque-gold-500 to-mosque-gold-700 flex items-center justify-center font-bold text-white flex-shrink-0">
              K
            </div>
          </div>
          {/* Expanded text - appears to the right of K */}
          <div className={'transition-opacity duration-200 whitespace-nowrap ' + (isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <h1 className="text-lg font-bold text-mosque-gold-500">Kelpie AI</h1>
            <p className="text-xs text-gray-400">CRMFS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.name}
                to={item.to}
                className={'relative flex items-center rounded-lg transition-all duration-200 overflow-hidden mx-2 py-3 ' +
                  (isActive
                    ? 'bg-mosque-gold-600 text-white'
                    : 'text-gray-300 hover:bg-mosque-green-700 hover:text-white')}
              >
                <div className="w-12 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={'font-medium whitespace-nowrap transition-opacity duration-200 ' +
                  (isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Control Section */}
        <div className="p-2 mt-auto flex-shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSidebarMenu(!showSidebarMenu);
            }}
            className="w-full flex items-center py-2 text-white hover:bg-mosque-green-700 rounded-lg transition-colors relative"
          >
            <div className="w-12 flex items-center justify-center flex-shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-mosque-green-200" />
            </div>
            <span className={'text-xs font-medium text-mosque-green-200 whitespace-nowrap transition-opacity duration-200 ' +
              (isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
              Sidebar control
            </span>
          </button>

          {/* Sidebar Control Menu */}
          {showSidebarMenu && (
            <div
              className={'absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[200px] mb-2 ' +
                (isExpanded ? 'left-2 right-2 bottom-full' : 'left-16 bottom-2')}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleSidebarModeChange('expanded')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
              >
                <span>Expanded</span>
                {sidebarMode === 'expanded' && <Check className="h-4 w-4 text-mosque-green-600 dark:text-mosque-green-400" />}
              </button>
              <button
                onClick={() => handleSidebarModeChange('collapsed')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
              >
                <span>Collapsed</span>
                {sidebarMode === 'collapsed' && <Check className="h-4 w-4 text-mosque-green-600 dark:text-mosque-green-400" />}
              </button>
              <button
                onClick={() => handleSidebarModeChange('hover')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
              >
                <span>Expand on hover</span>
                {sidebarMode === 'hover' && <Check className="h-4 w-4 text-mosque-green-600 dark:text-mosque-green-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Profile Section at Bottom */}
        <div className="border-t border-mosque-green-700 p-2 flex-shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
            }}
            className="w-full flex items-center py-3 text-white hover:bg-mosque-green-700 rounded-lg transition-colors relative"
          >
            {/* Profile Picture - fixed left via w-12 container */}
            <div className="w-12 flex items-center justify-center flex-shrink-0">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={getDisplayName()}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-mosque-gold-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-mosque-gold-500 flex items-center justify-center text-mosque-green-900 font-bold text-sm flex-shrink-0">
                  {getInitial()}
                </div>
              )}
            </div>

            {/* Name (show when expanded) */}
            <div className={'flex-1 text-left transition-opacity duration-200 ' +
              (isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
              <p className="text-sm font-medium text-white truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-mosque-green-200 truncate">
                {getRoleLabel()}
              </p>
            </div>

            {/* Dropdown Icon */}
            <ChevronDown className={'h-4 w-4 text-mosque-green-200 mr-2 transition-opacity duration-200 ' +
              (showProfileMenu ? 'rotate-180 ' : '') +
              (isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none')} />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div
              className={'absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[200px] mb-2 ' +
                (isExpanded ? 'left-2 right-2 bottom-full' : 'left-16 bottom-2')}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors"
              >
                <Settings className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="truncate">Settings</span>
              </button>

              <button
                onClick={() => {
                  handleSignOut();
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center border-t border-gray-100 dark:border-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">Sign Out</span>
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
