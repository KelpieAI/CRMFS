import { ReactNode, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CollapsibleSidebar, { getSidebarMode, SidebarMode } from './CollapsibleSidebar';
import PoweredByBadge from './PoweredByBadge';

interface CompactLayoutProps {
  children?: ReactNode;
  showSubNav?: boolean;
  subNav?: ReactNode;
}

export default function CompactLayout({ children, showSubNav = false, subNav }: CompactLayoutProps) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(getSidebarMode);

  useEffect(() => {
    const handler = (e: Event) => {
      setSidebarMode((e as CustomEvent<SidebarMode>).detail);
    };
    window.addEventListener('sidebarModeChange', handler);
    return () => window.removeEventListener('sidebarModeChange', handler);
  }, []);

  const subNavLeft = sidebarMode === 'expanded' ? 'left-64' : 'left-16';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors">
      <CollapsibleSidebar />

      {showSubNav && subNav && (
        <div className={'hidden lg:block flex-shrink-0 fixed top-0 h-screen z-30 transition-all duration-300 ' + subNavLeft}>
          {subNav}
        </div>
      )}

      <main className={`flex-1 overflow-x-hidden ${showSubNav ? 'lg:ml-72' : ''}`}>
        <div className="max-w-[1920px] mx-auto">
          <div className="pt-20 md:pt-8 px-4 md:px-6 lg:px-8 py-6">
            {children || <Outlet />}
          </div>
        </div>
      </main>

      <PoweredByBadge />
    </div>
  );
}