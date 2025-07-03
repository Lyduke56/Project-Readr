import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ForgotPass.css';

export const ForgotPass = ({ email: initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link!');
        setEmail('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgotpass-container">
      <div className="forgotpass-form-wrapper">
        <h2 className="forgotpass-title">Forgot your password?</h2>
        <p className="forgotpass-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form className="forgotpass-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="forgotpass-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="forgotpass-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="forgotpass-error">{error}</div>}
          {message && <div className="forgotpass-success">{message}</div>}

          <div>
            <button
              type="submit"
              disabled={loading || !email}
              className="forgotpass-button"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
