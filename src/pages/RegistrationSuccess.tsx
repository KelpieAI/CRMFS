import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, UserPlus, Eye } from 'lucide-react';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get member data and payment status from route state
  const memberId = location.state?.memberId;
  const memberName = location.state?.memberName || 'New Member';
  const paymentReceived = location.state?.paymentReceived || false;

  useEffect(() => {
    // Auto-redirect if no member data (shouldn't happen)
    if (!memberId) {
      navigate('/members');
    }
  }, [memberId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header - Different based on payment status */}
          {paymentReceived ? (
            // PAYMENT RECEIVED - Success State
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
            // PAYMENT PENDING - Pending State
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-full p-3">
                  <Clock className="h-16 w-16 text-yellow-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Pending Approval
              </h1>
              <p className="text-yellow-100 text-lg">
                {memberName}'s application is awaiting payment
              </p>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Status Message */}
            <div className={`
              rounded-lg p-6 mb-6 text-center
              ${paymentReceived
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-yellow-50 border border-yellow-200'
              }
            `}>
              {paymentReceived ? (
                <div>
                  <p className="text-emerald-800 font-medium mb-2">
                    ✅ Payment received and processed
                  </p>
                  <p className="text-emerald-600 text-sm">
                    Member status: <span className="font-semibold">ACTIVE</span>
                  </p>
                  <p className="text-emerald-600 text-sm">
                    Membership benefits are now active
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-yellow-800 font-medium mb-2">
                    ⏳ Payment pending
                  </p>
                  <p className="text-yellow-600 text-sm">
                    Member status: <span className="font-semibold">PENDING</span>
                  </p>
                  <p className="text-yellow-600 text-sm">
                    Membership will activate once payment is received
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* View Member Profile */}
              <button
                onClick={() => navigate(`/members/${memberId}`)}
                className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Eye className="h-5 w-5 mr-2" />
                View Member Profile
              </button>

              {/* Register Another Member - BIG BUTTON */}
              <button
                onClick={() => navigate('/members/new')}
                className="w-full flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-lg shadow-lg"
              >
                <UserPlus className="h-6 w-6 mr-2" />
                Register Another Member
              </button>

              {/* View All Members */}
              <button
                onClick={() => navigate('/members')}
                className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                View All Members →
              </button>
            </div>
          </div>
        </div>

        {/* Reference Number (Optional) */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Reference: #{memberId?.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
