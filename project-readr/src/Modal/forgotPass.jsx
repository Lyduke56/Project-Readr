import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ForgotPass.css';

export const ForgotPass = ({ email }) => {
  const [step, setStep] = useState('sending'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (email && step === 'sending') {
      handleSendResetEmail();
    }
  }, [email]);

  const handleSendResetEmail = async () => {
    if (!email) {
      setError('No email provided');
      setStep('error');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `http://localhost:5173/#/ResetPass`,
      });

      if (error) {
        setError(error.message);
        setStep('error');
      } else {
        setStep('sent');
      }
    } catch {
      setError('An unexpected error occurred');
      setStep('error');
    }
    
    setLoading(false);
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  if (step === 'sending') {
    return (
      <div className="forgot-pass-container">
        <div className="forgot-pass-card">
          <div className="icon-container blue">
            <span>📧</span>
          </div>
          <h1 className="forgot-pass-title">Sending Reset Email</h1>
          <p className="forgot-pass-subtitle mb-6">
            Sending password reset link to <span className="email-highlight">{email}</span>
          </p>
          <div className="btn-primary blue" style={{ justifyContent: 'center' }}>
            <div className="spinner"></div>
            Sending...
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="forgot-pass-container">
        <div className="forgot-pass-card text-center">
          <div className="icon-container blue">
            <span>❌</span>
          </div>
          <h1 className="forgot-pass-title">Error</h1>
          {error && (
            <div className="error-message">
              <p className="error-text">{error}</p>
            </div>
          )}
          <button onClick={handleSendResetEmail} className="btn-primary blue">
            Try Again
          </button>
          <div className="nav-section">
            <button onClick={goToLogin} className="link-btn">
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <div className="forgot-pass-container sent-step">
        <div className="forgot-pass-card text-center">
          <div className="icon-container green">
            <span>📧</span>
          </div>
          <h1 className="forgot-pass-title">Check Your Email</h1>
          <p className="forgot-pass-subtitle mb-6">
            We've sent a password reset link to <span className="email-highlight">{email}</span>
          </p>
          <div className="info-box">
            <p className="info-text">
              <strong>Important:</strong> Check your spam folder if you don't see the email within a few minutes.
            </p>
          </div>
          <button onClick={goToLogin} className="link-btn">
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};
