import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, CreditCard, FileText, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchResult {
  type: 'member' | 'deceased' | 'payment' | 'page';
  id?: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: any;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Open/close with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(getQuickActions());
      return;
    }

    setIsSearching(true);

    try {
      // Search members
      const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, member_status')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      // Search deceased
      const { data: deceased } = await supabase
        .from('deceased')
        .select('id, deceased_name')
        .ilike('deceased_name', `%${searchQuery}%`)
        .limit(3);

      const searchResults: SearchResult[] = [];

      // Add members
      if (members) {
        members.forEach(member => {
          searchResults.push({
            type: 'member',
            id: member.id,
            title: `${member.first_name} ${member.last_name}`,
            subtitle: member.email,
            href: `/members/${member.id}`,
            icon: User,
          });
        });
      }

      // Add deceased
      if (deceased) {
        deceased.forEach(dec => {
          searchResults.push({
            type: 'deceased',
            id: dec.id,
            title: dec.deceased_name,
            subtitle: 'Deceased Member',
            href: `/deceased/${dec.id}`,
            icon: Users,
          });
        });
      }

      // Add page results if query matches
      const pages = getQuickActions().filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults([...searchResults, ...pages]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Quick actions (shown when no query)
  const getQuickActions = (): SearchResult[] => [
    {
      type: 'page',
      title: 'Dashboard',
      subtitle: 'Go to dashboard',
      href: '/',
      icon: FileText,
    },
    {
      type: 'page',
      title: 'Add New Member',
      subtitle: 'Register new member',
      href: '/members/new',
      icon: User,
    },
    {
      type: 'page',
      title: 'View All Members',
      subtitle: 'Member list',
      href: '/members',
      icon: Users,
    },
    {
      type: 'page',
      title: 'Payments',
      subtitle: 'View payments',
      href: '/payments',
      icon: CreditCard,
    },
    {
      type: 'page',
      title: 'Deceased Members',
      subtitle: 'Funeral records',
      href: '/deceased',
      icon: Users,
    },
  ];

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, performSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }

      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigate(results[selectedIndex].href);
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members, deceased, or navigate..."
              className="flex-1 outline-none text-base placeholder-gray-400"
              autoFocus
            />
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isSearching ? (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {query ? 'No results found' : 'Start typing to search...'}
              </div>
            ) : (
              <div className="py-2">
                {!query && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </div>
                )}
                {results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.type}-${result.id || result.href}`}
                      onClick={() => {
                        navigate(result.href);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={`w-full flex items-center px-4 py-3 hover:bg-gray-100 transition-colors ${
                        index === selectedIndex ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg mr-3 ${
                          result.type === 'member'
                            ? 'bg-blue-100 text-blue-600'
                            : result.type === 'deceased'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500">{result.subtitle}</p>
                        )}
                      </div>
                      {index === selectedIndex && (
                        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded mr-1">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded mr-1">
                  ↵
                </kbd>
                Select
              </span>
            </div>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded mr-1">
                ⌘K
              </kbd>
              or
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded mx-1">
                Ctrl K
              </kbd>
              to toggle
            </span>
          </div>
        </div>
      </div>
    </>
  );
}