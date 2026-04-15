import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, Hash, ArrowRight, FileX, User } from 'lucide-react';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const TOTAL_STEPS = 9;

export default function ApplicationsInProgressPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications-in-progress-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications_in_progress')
        .select('*')
        .eq('status', 'in_progress')
        .order('last_saved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (!searchTerm.trim()) return applications;

    const term = searchTerm.toLowerCase();
    return applications.filter((app: any) => {
      const refMatch = app.application_reference?.toLowerCase().includes(term);
      const firstNameMatch = app.main_first_name?.toLowerCase().includes(term);
      const lastNameMatch = app.main_last_name?.toLowerCase().includes(term);
      const jointFirstMatch = app.joint_first_name?.toLowerCase().includes(term);
      const jointLastMatch = app.joint_last_name?.toLowerCase().includes(term);
      return refMatch || firstNameMatch || lastNameMatch || jointFirstMatch || jointLastMatch;
    });
  }, [applications, searchTerm]);

  const resumeApplication = (app: any) => {
    navigate(`/members/new?draft=${app.application_reference}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Applications In Progress</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Resume incomplete member registrations
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-white mr-2" />
            <h2 className="text-base font-semibold text-white">Saved Applications</h2>
          </div>
          {applications && (
            <span className="text-sm text-yellow-100">
              {filteredApplications.length} of {applications.length} shown
            </span>
          )}
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference number or applicant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <FileX className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {searchTerm ? 'No matching applications' : 'No applications in progress'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search term.'
                : 'Incomplete registrations will appear here when saved.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Application Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Applicant Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApplications.map((app: any) => (
                  <tr
                    key={app.id}
                    onClick={() => resumeApplication(app)}
                    className="hover:bg-yellow-50/60 dark:hover:bg-yellow-900/10 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
                        <span className="font-mono text-sm text-yellow-700 dark:text-yellow-400 font-semibold">
                          {app.application_reference}
                        </span>
                        {app.app_type && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                            {app.app_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          {app.main_first_name ? (
                            <span className="text-white text-xs font-semibold">
                              {app.main_first_name[0]}{app.main_last_name?.[0] || ''}
                            </span>
                          ) : (
                            <User className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {app.main_first_name && app.main_last_name
                              ? `${app.main_first_name} ${app.main_last_name}`
                              : <span className="text-gray-400 italic">Unnamed applicant</span>}
                          </p>
                          {app.app_type === 'joint' && app.joint_first_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              & {app.joint_first_name} {app.joint_last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px]">
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all"
                              style={{ width: `${(((app.current_step || 0) + 1) / TOTAL_STEPS) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Step {(app.current_step || 0) + 1} of {TOTAL_STEPS}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTimeAgo(app.last_saved_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {app.created_by ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span className="font-mono text-xs">{app.created_by.slice(0, 8)}...</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resumeApplication(app);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      >
                        Resume
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
