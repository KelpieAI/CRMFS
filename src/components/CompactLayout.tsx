import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import CollapsibleSidebar from './CollapsibleSidebar';
import PoweredByBadge from './PoweredByBadge';

interface CompactLayoutProps {
  children?: ReactNode;
  showSubNav?: boolean;
  subNav?: ReactNode;
}

export default function CompactLayout({ children, showSubNav = false, subNav }: CompactLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Collapsible Sidebar */}
      <CollapsibleSidebar />

      {/* Sub-navigation (for member details, etc.) */}
      {showSubNav && subNav && (
        <div className="hidden lg:block flex-shrink-0">
          {subNav}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-[1920px] mx-auto">
          {/* Add padding to account for mobile hamburger */}
          <div className="pt-16 md:pt-0 px-4 md:px-6 lg:px-8 py-6">
            {/* Use Outlet for nested routes, or children if passed directly */}
            {children || <Outlet />}
          </div>
        </div>
      </main>

      {/* Powered By Badge */}
      <PoweredByBadge />
    </div>
  );
}