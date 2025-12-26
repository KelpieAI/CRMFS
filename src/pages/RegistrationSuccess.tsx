import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberName, memberId, applicationReference } = location.state || {};

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!memberId) {
      navigate('/');
    }
  }, [memberId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Registration Successful!
            </h1>
            <p className="text-emerald-100">
              The membership application has been submitted successfully
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Member Details */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Application Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Name:</span>
                    <span className="font-semibold text-gray-900">{memberName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member ID:</span>
                    <span className="font-mono text-sm font-semibold text-emerald-600">
                      {memberId || 'N/A'}
                    </span>
                  </div>
                  {applicationReference && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Application Reference:</span>
                      <span className="font-mono text-sm font-semibold text-emerald-600">
                        {applicationReference}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-md font-semibold text-blue-900 mb-3">
                  What Happens Next?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                    <span>Your application will be reviewed by our team</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                    <span>You will receive a confirmation email within 24-48 hours</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                    <span>Payment processing will begin once approved</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                    <span>You can view your application status in the member portal</span>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  If you have any questions, please contact us at{' '}
                  <a href="mailto:info@crmfs.org" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    info@crmfs.org
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/members/${memberId}`)}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md"
            >
              View Member Profile
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/members/new')}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Register another member →
          </button>
        </div>
      </div>
    </div>
  );
}