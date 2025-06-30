import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const ResetPass = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid password recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
          setCheckingSession(false);
          return;
        }

        if (session && session.user) {
          setValidSession(true);
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
        
        setCheckingSession(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setCheckingSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
        setCheckingSession(false);
      } else if (event === 'SIGNED_OUT') {
        setValidSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          window.location.href = '/login'; // Change to your login page route
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  const goToLogin = () => {
    window.location.href = '/login'; // Change to your login page route
  };

  const requestNewReset = () => {
    window.location.href = '/forgot-password'; // Change to your forgot password page route
  };

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifying Reset Link...</h1>
          <p className="text-gray-600">Please wait while we verify your password reset link.</p>
        </div>
      </div>
    );
  }

  // Invalid session - show error
  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">❌</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>

          <div className="space-y-3">
            <button
              onClick={requestNewReset}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Request New Reset Link
            </button>
            
            <button
              onClick={goToLogin}
              className="w-full text-blue-600 hover:text-blue-800 font-medium py-2"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✅</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully updated. You can now log in with your new password.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              Redirecting to login page in 3 seconds...
            </p>
          </div>

          <button
            onClick={goToLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            🏠 Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
          <p className="text-gray-600">Enter your new password below to complete the reset.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter new password (min. 6 characters)"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating Password...
              </>
            ) : (
              <>
                🔒 Update Password
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={goToLogin}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            ← Cancel and go to Login
          </button>
        </div>
      </div>
    </div>
  );
};
