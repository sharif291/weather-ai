import React, { useState } from 'react';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import { firebaseService } from '../services/firebase.js';

export const AuthScreen = () => {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      await firebaseService.auth.login(authEmail, authPassword);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      await firebaseService.auth.register(authEmail, authPassword, authName);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await firebaseService.auth.signInWithGoogle();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail) {
      setAuthError("Please enter your email address in the email field first.");
      return;
    }
    setAuthError(null);
    try {
      await firebaseService.auth.resetPassword(authEmail);
      alert(`A password reset link has been sent to: ${authEmail}`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/15 via-transparent to-transparent"></div>

      <div className="z-10 w-full max-w-md bg-slate-900/40 border border-slate-900/60 backdrop-blur-md rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-3xl">🌱</span>
          <h1 className="text-2xl font-black text-white tracking-tight">TerraClimate</h1>
          <p className="text-xs text-slate-500">Precision Agriculture & Telemetry Dashboard</p>
        </div>

        <form onSubmit={isRegistering ? handleSignUp : handleSignIn} className="space-y-4">
          {isRegistering && (
            <div className="relative">
              <FiUser className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-slate-300"
                required
              />
            </div>
          )}

          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-slate-300"
              required
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
            <input 
              type="password" 
              placeholder="Password" 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-slate-300"
              required
            />
          </div>

          {!isRegistering && (
            <div className="flex justify-end text-[10px] text-slate-500">
              <button
                type="button"
                onClick={handleResetPassword}
                className="hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {authError && (
            <p className="text-rose-400 text-xs font-semibold">{authError}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-black transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-900"></div>
          <span className="flex-shrink mx-4 text-slate-600 text-[10px] font-bold uppercase tracking-wider">Or</span>
          <div className="flex-grow border-t border-slate-900"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError(null);
            }}
            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
