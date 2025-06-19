import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { session, signUpNewUser } = UserAuth();
  console.log(session);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    //Error Handling for user's inputs
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await signUpNewUser(email, password);

      if (result.success) {
        // Optional: alert user to check their email
        navigate("/About");
      } else {
        setError(result.error.message || "Error signing up");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

   const handleConfirmPasswordChange = (e) => {             //Handles confirm password change - password and confirm password didn't match
        const confirmValue = e.target.value;
        setConfirmPassword(confirmValue);
        

        if (password && confirmValue && password !== confirmValue) { 
            setError("Passwords do not match");             //Returns if didn't match
        } else if (password === confirmValue) {
            setError('');
        }
    };

  return (
    <div>             {/*Sign up - please import the css file then you can adjust the className for an better/effective approach*/}
      <form onSubmit={handleSignUp} className="">
        <h2 className="">Sign Up Brother!</h2>
        <p>
          Already have an account? <Link to="/SignIn">Sign in!</Link>
        </p>
        <div className="up_div">
            {/*Email*/} 
          <input
                onChange={(e) => setEmail(e.target.value)}
                className="up_email"
                placeholder="Email"
                type="email"
          />
            {/*Password*/}
          <input
                onChange={(e) => setPassword(e.target.value)}
                className="up_pass"
                placeholder="Password"
                type="password"
          />
            {/*Confirm Password*/}
            <input 
                onChange={handleConfirmPasswordChange} 
                className={`up_pass ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm Password" 
                type="password"
                value={confirmPassword}
            />
            {/*Submit Button */}
          <button
            type="submit"
            disabled={loading || (password && confirmPassword && password !== confirmPassword)}
            className={`up_button ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </div>
      </form>
    </div>
  );
}
