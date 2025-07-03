import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"
import { ImageCarousel } from "../components/ImageCarousel"
import "./SignUp.css"


export function SignUp(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')
    
    const navigate = useNavigate();
    const {session, signUpNewUser} = UserAuth();
    console.log(session);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMatchError, setPasswordMatchError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPasswordMatchError('');

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
                navigate("/AddInfo");
            } else {
                setError(result.error.message);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-content">
                <div className="signup-form-container">
                    <div className="signup-title">
                        <p>
                            <span className="tracking-[0.23px]">Welcome to <span className="readr-title">Readr</span></span>
                        </p>
                    </div>
                        <form onSubmit={handleSignUp}>
                        <div className="input-group email-input">
                            <label>Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Enter your email" 
                            />
                        </div>
                        <div className="input-group password-input">
                            <label>Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Enter your password" 
                            />
                        </div>
                        <div className="input-group confirm-password-input">
                            <label>Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder="Confirm your password" 
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        {passwordMatchError && <p className="error-message">{passwordMatchError}</p>}
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="signup-button"
                        >
                            Register
                        </button>
                    </form>
                    <p className="signup-link">
                        Already have an account? <Link to="/SignIn">Sign in!</Link>
                    </p>
                </div>
                <div className="signup-image-container">
                    <ImageCarousel imagePath="/HomepagePic.png" />
                </div>
            </div>
        </div>
    );
}
