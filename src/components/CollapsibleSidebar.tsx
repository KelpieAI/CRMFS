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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CollapsibleSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
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
      // Check if mouse is within 5% of left edge (hover zone)
      const hoverZoneWidth = window.innerWidth * 0.05;
      if (e.clientX <= hoverZoneWidth) {
        setIsExpanded(true);
      } else if (e.clientX > 250) {
        // Close if mouse is beyond sidebar width
        setIsExpanded(false);
      }
    };

    // Only add listener on desktop
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

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
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
          fixed top-0 left-0 h-full bg-gray-900 text-white z-40 transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          {isExpanded ? (
            <div className="px-4 py-2">
              <h1 className="text-lg font-bold text-emerald-400">Kelpie AI</h1>
              <p className="text-xs text-gray-400">CRMFS</p>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white">
              K
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.name}
                to={item.to}
                className={`
                  flex items-center px-3 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${!isExpanded && 'justify-center'}
                `}
              >
                <Icon className={`h-5 w-5 ${isExpanded && 'mr-3'} flex-shrink-0`} />
                {isExpanded && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="border-t border-gray-800 p-2">
          <button
            onClick={handleSignOut}
            className={`
              w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200
              text-gray-300 hover:bg-gray-800 hover:text-white
              ${!isExpanded && 'justify-center'}
            `}
          >
            <LogOut className={`h-5 w-5 ${isExpanded && 'mr-3'} flex-shrink-0`} />
            {isExpanded && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Spacer for collapsed sidebar on desktop */}
      <div className="hidden md:block w-16" />
    </>
  );
}