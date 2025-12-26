import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-red-100">
                  We're sorry for the inconvenience. An unexpected error occurred.
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-8">
                <div className="space-y-6">
                  {/* Error Message */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-red-900 mb-3">
                      Error Details
                    </h2>
                    {this.state.error && (
                      <div className="space-y-2">
                        <p className="text-sm font-mono text-red-800 bg-white p-3 rounded border border-red-200 break-all">
                          {this.state.error.toString()}
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                          <details className="text-xs text-red-700 bg-white p-3 rounded border border-red-200">
                            <summary className="cursor-pointer font-semibold">
                              Stack Trace (Development Only)
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap overflow-x-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>

                  {/* What You Can Do */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-md font-semibold text-blue-900 mb-3">
                      What You Can Do
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                        <span>Try refreshing the page</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                        <span>Go back to the home page and try again</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                        <span>Clear your browser cache and cookies</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                        <span>Contact support if the problem persists</span>
                      </li>
                    </ul>
                  </div>

                  {/* Contact Info */}
                  <div className="text-center text-sm text-gray-600">
                    <p>
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
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;