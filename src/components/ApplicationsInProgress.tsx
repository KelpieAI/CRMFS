import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, ArrowRight } from 'lucide-react';

export default function ApplicationsInProgress() {
  const navigate = useNavigate();

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['applications-in-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications_in_progress')
        .select('*')
        .eq('status', 'in_progress')
        .order('last_saved_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const deleteApplication = async (reference: string) => {
    if (!confirm('Are you sure you want to delete this saved application?')) return;

    await supabase
      .from('applications_in_progress')
      .delete()
      .eq('application_reference', reference);

    refetch();
  };

  const continueApplication = (app: any) => {
    // Navigate to add member with saved data
    navigate('/members/new', { state: { savedApplication: app } });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications In Progress</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return null; // Don't show widget if no saved applications
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-yellow-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Applications In Progress</h2>
        </div>
        <span className="text-sm text-gray-500">{applications.length} saved</span>
      </div>

      <div className="space-y-3">
        {applications.map((app: any) => (
          <div
            key={app.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">
                  {app.main_first_name} {app.main_last_name}
                  {app.app_type === 'joint' && app.joint_first_name && (
                    <span className="text-gray-600"> & {app.joint_first_name} {app.joint_last_name}</span>
                  )}
                </p>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  {app.app_type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {app.application_reference} • Step {app.current_step + 1}/10 • 
                <span className="ml-1">
                  {new Date(app.last_saved_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => continueApplication(app)}
                className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
              <button
                onClick={() => deleteApplication(app.application_reference)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}