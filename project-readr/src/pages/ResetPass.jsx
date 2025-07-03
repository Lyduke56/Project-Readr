import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ResetPass.css";

export const ResetPass = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session || !data.session.user) {
          setError("Invalid or expired reset link. Please request a new one.");
          setCheckingSession(false);
          return;
        }

        setValidSession(true);
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setValidSession(true);
        setCheckingSession(false);
      } else if (event === "SIGNED_OUT") {
        setValidSession(false);
      }
    });

    return () => {
      if (listener?.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/SignIn");
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/SignIn");
  };

  const requestNewReset = () => {
    navigate("/SignIn");
  };

  if (checkingSession) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-icon-circle reset-blue-circle">
            <div className="reset-spinner"></div>
          </div>
          <h1>Verifying Reset Link...</h1>
          <p>Please wait while we verify your reset link.</p>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-icon-circle reset-red-circle">
            <span className="reset-icon">❌</span>
          </div>
          <h1>Invalid Reset Link</h1>
          <p>{error}</p>
          <button onClick={requestNewReset} className="reset-primary-btn">
            Request New Reset Link
          </button>
          <button onClick={goToLogin} className="reset-link-btn">
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-icon-circle reset-green-circle">
            <span className="reset-icon">✅</span>
          </div>
          <h1>Password Reset Successful!</h1>
          <p>Your password has been updated. Redirecting to login...</p>
          <button onClick={goToLogin} className="reset-primary-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-text-center">
          <div className="reset-icon-circle reset-purple-circle">
            <span className="reset-icon">🔒</span>
          </div>
          <h1>Create New Password</h1>
          <p>Enter your new password below.</p>
        </div>

        {error && <div className="reset-error-box">{error}</div>}

        <form onSubmit={handleResetPassword} className="reset-form">
          <div className="reset-form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              placeholder="New password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="reset-form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="reset-primary-btn">
            {loading ? (
              <>
                <div className="reset-spinner reset-small"></div>
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <div className="reset-text-center">
          <button onClick={goToLogin} className="reset-link-btn">
            ← Cancel and go to Login
          </button>
        </div>
      </div>
    </div>
  );
};
