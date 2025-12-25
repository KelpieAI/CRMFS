import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-emerald-800 to-emerald-900 overflow-y-auto border-r-4 border-yellow-600">
          {/* Logo/Header */}
          <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-emerald-700">
            <div className="text-center w-full">
              <h1 className="text-2xl font-bold text-yellow-400 drop-shadow-lg">
                Central Region
              </h1>
              <p className="text-sm text-yellow-200 mt-1">Muslim Funeral Service</p>
              <div className="mt-2 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      isActive(item.href)
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive(item.href) ? 'text-white' : 'text-emerald-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="flex-shrink-0 border-t border-emerald-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-100 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-emerald-300">Administrator</p>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-3 p-2 rounded-lg hover:bg-emerald-700 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5 text-emerald-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-emerald-800 to-emerald-900">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Mobile header */}
              <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-emerald-700">
                <div className="text-center w-full">
                  <h1 className="text-xl font-bold text-yellow-400">
                    Central Region
                  </h1>
                  <p className="text-xs text-yellow-200 mt-1">Muslim Funeral Service</p>
                </div>
              </div>

              {/* Mobile navigation */}
              <nav className="mt-6 flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-4 py-3 text-sm font-medium rounded-lg
                        ${
                          isActive(item.href)
                            ? 'bg-yellow-600 text-white'
                            : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile user section */}
              <div className="flex-shrink-0 border-t border-emerald-700 p-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-emerald-100 hover:bg-emerald-700 rounded-lg"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-10 lg:hidden bg-white shadow-sm border-b-2 border-emerald-600">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-emerald-800">CRMFS</h1>
            <div className="w-6" /> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
