import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type SidebarMode = 'expanded' | 'collapsed' | 'hover';

const LS_KEY = 'crmfs.sidebarMode';

function DashIcon() {
  // You asked for a dash icon button
  return <span className="inline-block w-5 text-center font-black leading-none">-</span>;
}

export default function CollapsibleSidebar() {
  const [mode, setMode] = useState<SidebarMode>('hover');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Members', to: '/members', icon: Users },
    { name: 'Payments', to: '/payments', icon: CreditCard },
    { name: 'Deceased', to: '/deceased', icon: Heart },
    { name: 'Reports', to: '/reports', icon: FileText },
  ];

  // Load saved mode
  useEffect(() => {
    const saved = window.localStorage.getItem(LS_KEY) as SidebarMode | null;
    if (saved === 'expanded' || saved === 'collapsed' || saved === 'hover') {
      setMode(saved);
    }
  }, []);

  // Persist mode
  useEffect(() => {
    window.localStorage.setItem(LS_KEY, mode);
  }, [mode]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isDesktop = useMemo(() => window.innerWidth >= 768, []);

  const isExpanded = useMemo(() => {
    if (!isDesktop) return true; // mobile overlay sidebar is always expanded
    if (mode === 'expanded') return true;
    if (mode === 'collapsed') return false;
    return isHovering; // hover mode
  }, [mode, isHovering, isDesktop]);

  // Sidebar width
  const sidebarWidthClass = isExpanded ? 'w-64' : 'w-16';

  // Spacer width (prevents content being under the fixed sidebar)
  // In hover mode we keep spacer collapsed so content doesn't jump when hovering.
  const spacerWidthClass =
    mode === 'expanded' ? 'w-64' : 'w-16';

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
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
        className={[
          'fixed top-0 left-0 h-full z-40 text-white',
          'bg-gray-900 border-r border-white/10',
          'transition-[width,transform] duration-200 ease-out',
          sidebarWidthClass,
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        onMouseEnter={() => window.innerWidth >= 768 && setIsHovering(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setIsHovering(false)}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-center border-b border-white/10 overflow-hidden">
          {isExpanded ? (
            <div className="px-4 py-2 w-full">
              <h1 className="text-lg font-bold text-emerald-400 whitespace-nowrap">Kelpie AI</h1>
              <p className="text-xs text-white/60 whitespace-nowrap">CRMFS</p>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center font-extrabold text-emerald-200">
              K
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.name}
                to={item.to}
                className={[
                  'relative flex items-center rounded-lg overflow-hidden',
                  'transition-colors duration-150',
                  active
                    ? 'bg-emerald-500/15 text-white border border-emerald-400/25'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent',
                  'pl-3 pr-3 py-3',
                  !isExpanded ? 'justify-center' : '',
                ].join(' ')}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="ml-3 font-medium whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-white/10 p-2 space-y-2">
          {/* Mode toggles */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('expanded')}
                className={[
                  'rounded-lg border px-2 py-2 text-sm transition-colors',
                  mode === 'expanded'
                    ? 'bg-emerald-400/20 border-emerald-400/30 text-white'
                    : 'bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white',
                ].join(' ')}
                title="Expanded"
              >
                <DashIcon />
              </button>

              <button
                onClick={() => setMode('collapsed')}
                className={[
                  'rounded-lg border px-2 py-2 text-sm transition-colors',
                  mode === 'collapsed'
                    ? 'bg-emerald-400/20 border-emerald-400/30 text-white'
                    : 'bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white',
                ].join(' ')}
                title="Collapsed"
              >
                <DashIcon />
              </button>

              <button
                onClick={() => setMode('hover')}
                className={[
                  'rounded-lg border px-2 py-2 text-sm transition-colors',
                  mode === 'hover'
                    ? 'bg-emerald-400/20 border-emerald-400/30 text-white'
                    : 'bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white',
                ].join(' ')}
                title="Expand on hover"
              >
                <DashIcon />
              </button>
            </div>

            {isExpanded && mode === 'hover' && (
              <div className="pt-2 px-1 text-xs text-white/50">
                Hover over the sidebar to expand.
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className={[
              'w-full flex items-center rounded-lg transition-colors',
              'text-white/70 hover:bg-white/5 hover:text-white',
              'pl-3 pr-3 py-3 border border-transparent hover:border-white/10',
              !isExpanded ? 'justify-center' : '',
            ].join(' ')}
            title={!isExpanded ? 'Sign out' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="ml-3 font-medium">Sign out</span>}
          </button>
        </div>
      </div>

      {/* Spacer for fixed sidebar on desktop */}
      <div className={['hidden md:block flex-shrink-0', spacerWidthClass].join(' ')} />
    </>
  );
}

export default CollapsibleSidebar;
