import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { ForgotPass } from '../Modal/forgotPass';
import { Modal } from "../Modal/Modal";
import { ImageCarousel } from "../components/ImageCarousel";
import "./SignIn.css";

export function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [greeting, setGreeting] = useState('');
    const [isOpened, setIsOpened] = useState(false);
    const [showCarousel, setShowCarousel] = useState(true);

    const navigate = useNavigate();
    const { signInUser } = UserAuth();
    const {doesEmailExist} = UserAuth();

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

        // Responsive: hide carousel on small screens
        const checkScreen = () => {
            setShowCarousel(window.innerWidth > 768);
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
                navigate("/Home");
            } else {
                setError("Invalid login, please try again!");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPass = async (e) => {
    e.preventDefault();

    if (!email) {
        setError("Please input your email!");
        return;
    }
    
    const exist = await doesEmailExist(email);

    if(!exist){
        console.log("Email does not exist!");
        setError("Email does not exist!");
        return;
    }

    console.log("Email exist!");
    setIsOpened(true);
};

    return (
        <div className="signin-container">
            <div className="signin-content">
                <div className="signin-form-container">
                    <div className="signin-title">
                        <p>
                            <span className="tracking-[0.23px]">
                                {greeting.split('Readr')[0]}
                                <span className="readr-title">Readr</span>
                                {greeting.split('Readr')[1] || ''}
                            </span>
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
                        {error && <p className="signin-error-message">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="signin-button"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="below-signin">
                        <p className="signin-link">
                            Don't have an account? <Link to="/SignUp">Sign up!</Link>
                        </p>
                        <button onClick={handleForgotPass} className="forgot-password-button">
                            Forgot Password
                        </button>
                    </div>
                </div>

                {/* Only show carousel on larger screens */}
                {showCarousel && (
                  <div className="signin-image-container">
                      <ImageCarousel imagePath="/WhyReadr.png" sectionPositions={[-5, 30, 60, 90]} />
                  </div>
                )}

                {isOpened && (
                    <Modal isOpened={isOpened} onClose={() => setIsOpened(false)}>
                        <ForgotPass email={email} />
                    </Modal>
                )}
            </div>
        </div>
    );
}
