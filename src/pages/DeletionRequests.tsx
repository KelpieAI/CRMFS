import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import CompactLayout from '../components/CompactLayout';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

export default function DeletionRequests() {
  const { data: requests, refetch } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDecision = async (requestId: string, status: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for your decision');
      return;
    }

    try {
      const { error } = await supabase
        .from('deletion_requests')
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Committee',
          decision_reason: reason,
        })
        .eq('id', requestId);

      if (error) throw error;

      if (status === 'approved') {
        const request = requests?.find((r: any) => r.id === requestId);
        if (request) {
          await supabase
            .from('members')
            .update({
              status: 'pending_deletion',
              deletion_scheduled_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              retention_category: 'pending_deletion',
            })
            .eq('id', request.member_id);
        }
      }

      refetch();
      alert(`Request ${status} successfully. Member will be notified.`);
    } catch (error) {
      console.error('Decision error:', error);
      alert('Failed to update request');
    }
  };

  return (
    <CompactLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Deletion Requests</h1>
          </div>
          <p className="text-sm text-gray-600">
            Review and process member data deletion requests (GDPR Article 17)
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Requests must be processed within 30 days.
            You can reject deletion if legal obligation to retain data (active membership, financial records, etc).
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {requests?.filter((r: any) => r.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests?.filter((r: any) => r.status === 'approved').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests?.filter((r: any) => r.status === 'rejected').length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests?.map((request: any) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.requester_name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-1">{request.requester_email}</p>

                  <div className="bg-gray-50 rounded p-3 mb-3 mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{request.reason}</p>
                  </div>

                  <p className="text-xs text-gray-500">
                    Requested: {new Date(request.requested_at).toLocaleString('en-GB')}
                    {request.metadata?.requested_via && (
                      <span className="ml-2">via {request.metadata.requested_via}</span>
                    )}
                  </p>

                  {request.reviewed_at && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Reviewed: {new Date(request.reviewed_at).toLocaleString('en-GB')} by{' '}
                        {request.reviewed_by}
                      </p>
                      {request.decision_reason && (
                        <p className="text-sm text-gray-700">
                          <strong>Decision reason:</strong> {request.decision_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for approval:');
                        if (reason) handleDecision(request.id, 'approved', reason);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) handleDecision(request.id, 'rejected', reason);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!requests || requests.length === 0) && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-gray-500">No deletion requests yet</p>
            </div>
          )}
        </div>
      </div>
    </CompactLayout>
  );
}
