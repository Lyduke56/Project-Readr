import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"
import "./SignIn.css"

export function SignIn(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [greeting, setGreeting] = useState('')
    
    const navigate = useNavigate();
    const { session, signInUser } = UserAuth();

    useEffect(() => {
        const greetings = [
            "Welcome Back to Sign In at Readr",
            "Good to See You Again at Readr",
            "Hello, Sign In to Readr",
            "Hey There, Log In to Readr",
            "Greetings, Sign In at Readr"
        ];
        const randomIndex = Math.floor(Math.random() * greetings.length);
        setGreeting(greetings[randomIndex]);
    }, []);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);

        //Error Handling for user's inputs
        if (!email || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
        const result = await signInUser(email, password); 

        if (result.success) {
            navigate("/Homepage"); 
        } else {
            setError(result.error.message); 
            setError("Invalid login, please try again!")
        }
        } catch (err) {
        setError("An unexpected error occurred."); 
        } finally {
        setLoading(false); 
        }
     };

    return (
        <div className="signin-container">
            <div className="signin-content">
                <div className="signin-form-container">
                    <div className="signin-title">
                        <p>
                            <span className="tracking-[0.23px]">{greeting.split('Readr')[0]}<span className="readr-title">Readr</span>{greeting.split('Readr')[1] || ''}</span>
                        </p>
                    </div>
                    <form onSubmit={handleSignIn}>
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
                        {error && <p className="error-message">{error}</p>}
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="signin-button"
                        >
                            Sign In
                        </button>
                    </form>
                    <p className="signin-link">
                        Don't have an account? <Link to="/SignUp">Sign up!</Link>
                    </p>
                </div>
                <div className="signin-image-container">
                    <img src="/LibraryPic.png" alt="Library" className="signin-image" />
                    <p></p>
                </div>
            </div>
        </div>
    );
}
