import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, ArrowRight, Search, Hash } from 'lucide-react';

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

export default function ApplicationsInProgress() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['applications-in-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications_in_progress')
        .select('*')
        .eq('status', 'in_progress')
        .order('last_saved_at', { ascending: false })
        .limit(20);

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

  const deleteApplication = async (reference: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved application?')) return;

    await supabase
      .from('applications_in_progress')
      .delete()
      .eq('application_reference', reference);

    refetch();
  };

  const continueApplication = (app: any) => {
    navigate(`/members/new?draft=${app.application_reference}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Applications In Progress</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return null;
  }

  const totalSteps = 9;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Applications In Progress</h2>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{applications.length} saved</span>
      </div>

      {applications.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      )}

      <div className="space-y-3">
        {filteredApplications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No applications match your search.
          </p>
        ) : (
          filteredApplications.map((app: any) => (
            <div
              key={app.id}
              onClick={() => continueApplication(app)}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    {app.application_reference}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 capitalize">
                    {app.app_type}
                  </span>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {app.main_first_name && app.main_last_name
                    ? `${app.main_first_name} ${app.main_last_name}`
                    : 'Unnamed applicant'}
                  {app.app_type === 'joint' && app.joint_first_name && (
                    <span className="text-gray-600 dark:text-gray-400"> & {app.joint_first_name} {app.joint_last_name}</span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Step {(app.current_step || 0) + 1}/{totalSteps}
                  </span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(app.last_saved_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    continueApplication(app);
                  }}
                  className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm opacity-0 group-hover:opacity-100"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
                <button
                  onClick={(e) => deleteApplication(app.application_reference, e)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
