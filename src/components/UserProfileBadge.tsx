import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

export default function UserProfileBadge() {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profile) return null;

  const getRoleBadge = () => {
    switch (profile.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            Admin
          </span>
        );
      case 'chairman':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            Chairman
          </span>
        );
      case 'treasurer':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Treasurer
          </span>
        );
      case 'developer':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white border border-cyan-300 shadow-sm">
            🐕 Developer
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = () => {
    return profile.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = () => {
    switch (profile.role) {
      case 'admin':
        return 'bg-emerald-600';
      case 'chairman':
        return 'bg-purple-600';
      case 'treasurer':
        return 'bg-blue-600';
      case 'developer':
        return 'bg-gradient-to-r from-cyan-500 to-teal-500';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor()}`}
        >
          {getInitials()}
        </div>

        {/* Name & Role */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
          <div className="flex items-center space-x-1">
            {getRoleBadge()}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
            <div className="mt-2">{getRoleBadge()}</div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile settings (to be built)
                alert('Profile settings coming soon!');
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <User className="h-4 w-4 mr-3 text-gray-400" />
              Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings (to be built)
                alert('Settings coming soon!');
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-400" />
              Settings
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}