import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, UserPlus, Eye, Info } from 'lucide-react';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const memberId = location.state?.memberId;
  const membershipNumber = location.state?.membershipNumber;
  const memberName = location.state?.memberName || 'New Member';
  const memberEmail = location.state?.memberEmail || '';
  const paymentReceived = location.state?.paymentReceived || false;

  useEffect(() => {
    if (!memberId) {
      navigate('/members');
    }
  }, [memberId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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

          <div className="p-8">
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900 text-sm">
                Registration complete. The committee will send document upload and declaration links manually from the member profile when ready.
              </p>
            </div>

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

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 font-mono">
            {membershipNumber || `#${memberId?.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
