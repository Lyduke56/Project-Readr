import { Link } from "react-router-dom"

export function WelcomePage(){
    return (
        <>
            <div className="welcome-hero">
                <h1>Welcome to Readr</h1>
                <p>Your all-in-one document reader</p>
      
                <div className="hero-buttons">
                    <Link to="/SignIn">
                    <button className="sign-in-btn">Sign In</button>
                    </Link>
                    <Link to="/SignUp">
                    <button className="get-started-btn">Get Started</button>
                    </Link>
                </div>
            </div>
        </>
    )
}