import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, UserPlus, Eye, Mail, FileText, Loader2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const memberId = location.state?.memberId;
  const membershipNumber = location.state?.membershipNumber;
  const memberName = location.state?.memberName || 'New Member';
  const memberEmail = location.state?.memberEmail || '';
  const paymentReceived = location.state?.paymentReceived || false;

  const [sendingDocumentEmail, setSendingDocumentEmail] = useState(false);
  const [sendingDeclarationsEmail, setSendingDeclarationsEmail] = useState(false);
  const [documentEmailSent, setDocumentEmailSent] = useState(false);
  const [declarationsEmailSent, setDeclarationsEmailSent] = useState(false);

  useEffect(() => {
    // Auto-redirect if no member data (shouldn't happen)
    if (!memberId) {
      navigate('/members');
    }
  }, [memberId, navigate]);

  const handleSendDocumentEmail = async () => {
    setSendingDocumentEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-member-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: memberId,
          emailType: 'document_upload',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }

      setDocumentEmailSent(true);
      alert('Document upload email sent successfully!');
    } catch (error) {
      console.error('Failed to send document upload email:', error);
      alert(error instanceof Error ? error.message : 'Failed to send email. Please try again.');
    } finally {
      setSendingDocumentEmail(false);
    }
  };

  const handleSendDeclarationsEmail = async () => {
    setSendingDeclarationsEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-member-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: memberId,
          emailType: 'declarations',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }

      setDeclarationsEmailSent(true);
      alert('Declarations email sent successfully!');
    } catch (error) {
      console.error('Failed to send declarations email:', error);
      alert(error instanceof Error ? error.message : 'Failed to send email. Please try again.');
    } finally {
      setSendingDeclarationsEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header - Different based on payment status */}
          {paymentReceived ? (
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-full p-3">
                  <CheckCircle className="h-16 w-16 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Registration Successful!
              </h1>
              <p className="text-emerald-100 text-lg">
                {memberName} is now an active member
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-full p-3">
                  <Clock className="h-16 w-16 text-yellow-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Registration Complete
              </h1>
              <p className="text-yellow-100 text-lg">
                {memberName}'s application is awaiting payment
              </p>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Member Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
              {membershipNumber && (
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Membership ID:</span>{' '}
                  <span className="font-mono text-emerald-700 font-bold">{membershipNumber}</span>
                </p>
              )}
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Member:</span> {memberName}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Email:</span> {memberEmail}
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-blue-900 font-medium mb-2 text-center">
                Member registered successfully! Use the buttons below to send secure email links to {memberEmail}.
              </p>
              <p className="text-blue-700 text-sm text-center">
                You can send these emails now or skip and send them later from the member detail page.
              </p>
            </div>

            {/* Email Action Buttons */}
            <div className="space-y-4 mb-8">
              {/* Document Upload Email Button */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Upload className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Document Upload Email</h3>
                    <p className="text-sm text-gray-600">
                      Sends a secure link for the member to upload required documents (Photo ID, Proof of Address, Birth Certificates for children).
                    </p>
                  </div>
                </div>
                {documentEmailSent ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Email sent successfully!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSendDocumentEmail}
                    disabled={sendingDocumentEmail}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {sendingDocumentEmail ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Send Document Upload Email
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Declarations Email Button */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Declarations Email</h3>
                    <p className="text-sm text-gray-600">
                      Sends a secure link for the member to read and sign required declarations and agreements.
                    </p>
                  </div>
                </div>
                {declarationsEmailSent ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Email sent successfully!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSendDeclarationsEmail}
                    disabled={sendingDeclarationsEmail}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {sendingDeclarationsEmail ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Send Declarations Email
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(`/members/${memberId}`)}
                className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Eye className="h-5 w-5 mr-2" />
                View Member Profile
              </button>

              <button
                onClick={() => navigate('/members/new')}
                className="w-full flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-lg shadow-lg"
              >
                <UserPlus className="h-6 w-6 mr-2" />
                Register Another Member
              </button>

              <button
                onClick={() => navigate('/members')}
                className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                View All Members →
              </button>
            </div>
          </div>
        </div>

        {/* Reference Number */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 font-mono">
            {membershipNumber || `#${memberId?.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
