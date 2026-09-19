import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DosiqLogo } from '../common/DosiqLogo';

const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        a[j - 1] === b[i - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

export const AuthCard = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const checkEmailTypo = (val) => {
    const parts = val.split('@');
    if (parts.length !== 2) { setEmailSuggestion(null); return; }
    const [user, domain] = parts;
    const lower = domain.toLowerCase();
    if (POPULAR_DOMAINS.includes(lower)) { setEmailSuggestion(null); return; }
    let best = null, minDist = 3;
    for (const d of POPULAR_DOMAINS) {
      const dist = levenshtein(lower, d);
      if (dist < minDist) { minDist = dist; best = d; }
    }
    setEmailSuggestion(best ? `${user}@${best}` : null);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setAlert(null);
    checkEmailTypo(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAlert({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (isSignUp && !fullName.trim()) {
      setAlert({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(trimmedEmail, password, fullName);
        setAlert({ type: 'success', message: 'Account created! Taking you in...' });
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setAlert({
          type: 'error',
          message: 'Incorrect email or password. New here? Switch to "Create Account" below.',
        });
      } else if (err.message?.includes('already registered')) {
        setIsSignUp(false);
        setAlert({ type: 'error', message: 'This email already has an account. Please sign in.' });
      } else {
        setAlert({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAlert(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not sign in with Google.' });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-200 relative overflow-hidden">

        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

        {/* Logo + tagline */}
        <div className="mb-6">
          <DosiqLogo size="large" showBadge={false} />
          <p className="text-xs text-slate-500 mt-2">
            {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs ${
              alert.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {alert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{alert.message}</span>
          </div>
        )}

        {/* ── Form: Email → (Name on sign-up) → Password → Submit ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-colors shadow-sm"
              />
            </div>
            {emailSuggestion && (
              <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center justify-between">
                <span>Did you mean <strong>{emailSuggestion}</strong>?</span>
                <button
                  type="button"
                  onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(null); }}
                  className="text-emerald-700 font-bold ml-2 underline"
                >
                  Use this
                </button>
              </div>
            )}
          </div>

          {/* Full name — sign-up only */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-colors shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              {!isSignUp && (
                <span className="text-[11px] text-slate-400">Min 6 characters</span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-colors shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-semibold text-sm transition-all duration-150 active:scale-[0.99] shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle sign in / sign up */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setAlert(null); }}
            className="font-bold text-emerald-700 hover:text-emerald-800 underline ml-1 transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Security note */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted &amp; secure. Your data stays private.</span>
        </div>

      </div>
    </div>
  );
};
