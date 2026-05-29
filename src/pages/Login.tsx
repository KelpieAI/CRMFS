import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, Heart, Loader2, Receipt, Users } from 'lucide-react';

function IslamicPatternOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="crmfs-islamic-stars" width="72" height="72" patternUnits="userSpaceOnUse">
          <polygon
            points="36,2 44,26 70,26 50,42 58,66 36,52 14,66 22,42 2,26 28,26"
            fill="#14B7A6"
          />
          <polygon
            points="36,10 42,28 62,28 48,40 54,58 36,48 18,58 24,40 10,28 30,28"
            fill="#D4AF37"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#crmfs-islamic-stars)" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: 'Member management',
    description: 'Registration, documents and declarations in one place',
  },
  {
    icon: Receipt,
    title: 'Payment tracking',
    description: 'Age-based fees, renewals and outstanding balances',
  },
  {
    icon: Heart,
    title: 'Built for the community',
    description: 'Serving Falkirk Central Mosque since 2021',
  },
] as const;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

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
      console.log('🚀 Navigating to:', from);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('💥 Login error:', err);
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
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
      console.log('🚀 Navigating to:', from);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('💥 Dev bypass error:', err);
      setError('Dev bypass failed. User may not exist.');
      setIsLoading(false);
    }
  };

  const inputClassName =
    'w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]';

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left panel — hidden on small screens */}
      <div className="relative hidden min-h-[280px] flex-[1.1] flex-col overflow-hidden bg-[#06420c] lg:flex">
        <IslamicPatternOverlay />

        <div className="relative z-10 flex flex-1 flex-col p-10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: '#D4AF37', color: '#06420c' }}
            >
              FCM
            </div>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: '#D4AF37' }}
            >
              CRMFS
            </span>
          </div>

          <div className="my-auto max-w-md py-12">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide"
              style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
            >
              <span className="text-[8px]">●</span> Built for Falkirk Central Mosque
            </span>

            <h1 className="mt-6 text-[26px] font-medium leading-snug text-white">
              The system behind{' '}
              <span style={{ color: '#D4AF37' }}>serious funeral care.</span>
            </h1>

            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Secure, modern member management for the Central Region Muslim Funeral Service.
            </p>

            <ul className="mt-10 space-y-5">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: '#D4AF37' }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Developed by{' '}
            <a
              href="https://kelpieai.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
              style={{ color: '#D4AF37' }}
            >
              Kelpie AI
            </a>
          </p>
        </div>
      </div>

      {/* Right panel — sign in */}
      <div className="flex w-full shrink-0 flex-col justify-center bg-[#111] px-8 py-10 lg:w-[340px] lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-sm">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: '#D4AF37' }}
          >
            Welcome back
          </p>
          <h2 className="mt-2 text-[22px] font-medium text-white">Sign in to CRMFS</h2>
          <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Secure access for authorised committee members only.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
                placeholder="your.email@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#1c1c1c]"
                  style={{ accentColor: '#D4AF37' }}
                />
                <span className="text-xs text-white/70">Keep me signed in</span>
              </label>
              <button
                type="button"
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: '#D4AF37' }}
                onClick={() => alert('Password reset coming soon!')}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: '#D4AF37', color: '#06420c' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div
            className="mt-6 rounded-lg border p-3"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                  Secure session
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Protected access for authorised committee members only
                </p>
              </div>
            </div>
          </div>

          <div className="my-6 border-t border-white/10" />

          <button
            type="button"
            onClick={handleDevBypass}
            disabled={isLoading}
            className="w-full rounded-lg border border-white/15 bg-transparent py-2.5 text-xs text-white/50 transition-colors hover:border-white/25 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Developer Login
          </button>
          <p className="mt-2 text-center text-[10px] text-white/30">Development access only</p>
        </div>
      </div>
    </div>
  );
}
