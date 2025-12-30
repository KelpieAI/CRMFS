import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Shield, FileText, Trash2, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('gdpr');
  const navigate = useNavigate();

  // Fetch deletion requests
  const { data: deletionRequests, refetch } = useQuery({
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
    if (!reason?.trim()) {
      alert('Please provide a reason for your decision');
      return;
    }

    try {
      const { error } = await supabase
        .from('deletion_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Committee',
          decision_reason: reason,
        })
        .eq('id', requestId);

      if (error) throw error;

      if (status === 'approved') {
        const request = deletionRequests?.find((r: any) => r.id === requestId);
        if (request?.member_id) {
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
      alert('Request ' + status + ' successfully.');
    } catch (error) {
      console.error('Decision error:', error);
      alert('Failed to update request');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('gdpr')}
            className={'pb-4 px-1 border-b-2 font-medium text-sm ' + (
              activeTab === 'gdpr'
                ? 'border-mosque-green-600 text-mosque-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            GDPR & Privacy
          </button>
        </nav>
      </div>

      {/* GDPR Tab */}
      {activeTab === 'gdpr' && (
        <div className="space-y-6">
          {/* Privacy Policy */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-mosque-green-600" />
              Privacy Policy
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Download the current privacy policy for members. This should be provided to all new members during registration.
            </p>
            <button className="px-4 py-2 border border-mosque-green-600 text-mosque-green-600 rounded-lg hover:bg-mosque-green-50 text-sm font-medium flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download Privacy Policy (PDF)
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Privacy policy must be reviewed annually and updated as needed. Last updated: January 2025
            </p>
          </div>

          {/* Deletion Requests */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                Deletion Requests
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    {deletionRequests?.filter((r: any) => r.status === 'pending').length || 0} Pending
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {deletionRequests?.filter((r: any) => r.status === 'approved').length || 0} Approved
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    {deletionRequests?.filter((r: any) => r.status === 'rejected').length || 0} Rejected
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>GDPR Article 17:</strong> Deletion requests must be processed within 30 days. 
                You can reject if legal obligation to retain data (active membership, financial records, etc).
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!deletionRequests || deletionRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No deletion requests</p>
              ) : (
                deletionRequests?.map((request: any) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.requester_name}</h3>
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (
                            request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.requester_email}</p>
                        <div className="bg-gray-50 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-xs text-gray-600">{request.reason}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(request.requested_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {request.metadata?.requested_via && ' • via ' + request.metadata.requested_via}
                        </p>
                        {request.reviewed_at && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">
                              Reviewed: {new Date(request.reviewed_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} by {request.reviewed_by}
                            </p>
                            {request.decision_reason && (
                              <p className="text-xs text-gray-700">
                                <strong>Decision:</strong> {request.decision_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for approval (e.g., "Member confirmed cancellation, no outstanding payments"):');
                              if (reason) handleDecision(request.id, 'approved', reason);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection (e.g., "Active membership with outstanding payments"):');
                              if (reason) handleDecision(request.id, 'rejected', reason);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Protection Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Committee Data Protection Obligations
            </h3>
            <ul className="text-xs text-blue-800 space-y-1.5">
              <li>• All member data must be kept confidential - do not share outside committee</li>
              <li>• Medical data (GP details, health conditions) is special category data - handle with extra care</li>
              <li>• Access only the data you need to perform your duties (principle of data minimization)</li>
              <li>• Log out when finished - do not leave system unattended</li>
              <li>• Report any suspected data breaches immediately to committee chair</li>
              <li>• Retain signed paper application forms securely for 7 years minimum</li>
              <li>• Member data access requests must be processed within 30 days</li>
              <li>• Deceased member records must be retained for 7 years before deletion/anonymization</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-300">
              <p className="text-xs text-blue-900 font-medium">
                <strong>In case of data breach:</strong> Contact committee chair immediately. ICO must be notified within 72 hours if high risk.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}