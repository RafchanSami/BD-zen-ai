import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password provided.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setError('Unable to complete Google Sign In.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#053B26] text-white rounded-3xl border border-[#005a42] shadow-2xl overflow-hidden">
        
        {/* Header decoration */}
        <div className="relative p-6 bg-[#006a4e] border-b border-[#005a42] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden border border-emerald-300 p-0.5">
              <img src="https://i.imgur.com/95NcIt4.png" alt="BD-Zen AI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-white tracking-wide">BD-Zen AI</h2>
              <p className="text-[10px] text-emerald-200/80 font-medium tracking-wider uppercase">
                {isSignUp ? 'Create New Account' : 'Sign In'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#005a42] text-emerald-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-[#8B0000]/30 border border-[#8B0000] rounded-xl text-xs text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white hover:bg-emerald-50 text-gray-800 rounded-xl font-bold text-xs transition shadow-md group disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="group-hover:text-[#053B26]">Sign in with Google</span>
          </button>

          <div className="flex items-center space-x-3 my-2">
            <div className="flex-1 h-px bg-[#005a42]"></div>
            <span className="text-[10px] uppercase font-bold text-emerald-200/60">Or with Email</span>
            <div className="flex-1 h-px bg-[#005a42]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-emerald-200">Your Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 absolute left-3 text-emerald-300" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#005a42]/60 border border-[#005a42] focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-emerald-300/50 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-emerald-200">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-emerald-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full bg-[#005a42]/60 border border-[#005a42] focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-emerald-300/50 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-emerald-200">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-emerald-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#005a42]/60 border border-[#005a42] focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-emerald-300/50 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          {/* Toggle Login / Signup */}
          <div className="text-center pt-2 border-t border-[#005a42]">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-emerald-200 hover:text-white font-medium underline transition"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Want to create an account? Sign Up'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
