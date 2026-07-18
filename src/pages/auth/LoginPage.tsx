import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff, Gem, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_DASHBOARD_PATH } from '../../constants/navigation';
import { UserRole } from '../../types/role.types';
import { MOCK_USERS } from '../../data/mock-users';

function getSafePostLoginPath(role: UserRole, attemptedPath?: string): string {
  const roleDashboardPath = ROLE_DASHBOARD_PATH[role];

  if (
    attemptedPath &&
    (attemptedPath === roleDashboardPath || attemptedPath.startsWith(`${roleDashboardPath}/`))
  ) {
    return attemptedPath;
  }

  return roleDashboardPath;
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getSafePostLoginPath(user.role, from), { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    const result = await login({ username: username.trim(), password });
    setIsLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Login failed.');
    } else if (result.user) {
      navigate(getSafePostLoginPath(result.user.role, from), { replace: true });
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Dream Jewels"
            className="h-10 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Dream Jewels</h1>
          <p className="text-sm text-slate-500 mt-1">Jewellery Management Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-5">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials Quick-Fill */}
        <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Demo Accounts — Click to fill
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => fillCredentials(u.username, u.password)}
                className="flex flex-col items-start p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-left transition-all group"
              >
                <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
                  {u.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{u.username} / {u.password}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} Dream Jewels. All rights reserved.
        </p>
      </div>
    </div>
  );
}
