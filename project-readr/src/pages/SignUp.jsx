import { useState } from "react"
import { Link, useNavigate } from "react-router-dom" 
import { UserAuth } from "../context/AuthContext"


export function SignUp(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')
    
    const navigate = useNavigate();
    const {session, signUpNewUser} = UserAuth();
    console.log(session);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);


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
        const result = await signUpNewUser(email, password); // Call context function

        if (result.success) {
            navigate("/SignIn"); // Navigate to dashboard on success
        } else {
            setError(result.error.message); // Show error message on failure
        }
        } catch (err) {
        setError("An unexpected error occurred."); // Catch unexpected errors
        } finally {
        setLoading(false); // End loading state
        }
     };

    return (
        <> 
        <div> {/* Aaron set some className, all you have to do is to import the css file for UI */}
            <form onSubmit={handleSignUp}  className="">
                <h2 className="">Sign Up Brother!</h2>
                <p>
                    Already have an account? <Link to="/SignIn">Sign in!</Link>
                </p>
                <div className="up_div">
                    <input onChange={(e) => setEmail(e.target.value)} className="up_email" placeholder="Email" type="email"></input> 
                    <input onChange={(e) => setPassword(e.target.value)} className="up_pass" placeholder="Password" type="password"></input> 
                    <button type="submit" disabled={loading} className="up_button">Sign Up</button> {/* Set button to check whether both pass and cpass are the same */}
                {error && <p className="text-red-600 text-center pt-4">{error}</p>}
                </div>
            </form>
        </div>
        </>
    )
}