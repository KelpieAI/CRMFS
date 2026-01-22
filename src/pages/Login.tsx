import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the page they were trying to access (or default to dashboard)
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login...');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        throw signInError;
      }

      console.log('✅ Login successful!', data.user?.email);

      // Skip the update_last_login RPC call - it might be hanging
      // Navigate immediately
      console.log('🚀 Navigating to:', from);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('💥 Login error:', err);
      setError(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleDevBypass = async () => {
    setEmail('admin@test.com');
    setPassword('Test123!');
    setIsLoading(true);
    setError('');

    try {
      console.log('🐉 Dev bypass starting...');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'Test123!',
      });

      if (signInError) {
        console.error('❌ Dev bypass error:', signInError);
        throw signInError;
      }

      console.log('✅ Dev bypass successful!', data.user?.email);

      // Skip the update_last_login RPC call - it might be hanging
      // Navigate immediately
      console.log('🚀 Navigating to:', from);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('💥 Dev bypass error:', err);
      setError('Dev bypass failed. User may not exist.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">K</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRMFS Login
          </h1>
          <p className="text-gray-600">
            Central Region Muslim Funeral Service
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="your.email@example.com"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                onClick={() => alert('Password reset coming soon!')}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Dev Bypass Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDevBypass}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            >
              <span className="mr-2">🐉</span>
              Developer Login
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Development access only
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <a
              href="https://kelpieai.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Kelpie AI
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Version 0.8.0.346 | Built for Falkirk Central Mosque
          </p>
        </div>
      </div>
    </div>
  );
}