import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center">
            <span className="text-9xl font-bold text-emerald-600">4</span>
            <div className="relative mx-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-pulse">
                <Search className="h-12 w-12 text-white" />
              </div>
            </div>
            <span className="text-9xl font-bold text-emerald-600">4</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or never existed.
          </p>

          {/* Suggestions */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-md font-semibold text-emerald-900 mb-3">
              Here's what you can do:
            </h3>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>Double-check the URL for typos</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>Go back to the previous page</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>Return to the homepage</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>Use the navigation menu to find what you need</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md"
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-600">
          Need help? Contact us at{' '}
          <a
            href="mailto:support@crmfs.org"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            support@crmfs.org
          </a>
        </p>
      </div>
    </div>
  );
}