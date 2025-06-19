import { useState } from "react"
import { Link, useNavigate } from "react-router-dom" 
import { UserAuth } from "../context/AuthContext"


export function SignIn(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const {session, signInUser} = UserAuth();
    const navigate = useNavigate();
    console.log(session);

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
        const result = await signInUser(email, password); // Call context function

        if (result.success) {
            navigate("/About"); 
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
        <div> {/* Aaron change/make some classNames then import the css file*/}
            <form onSubmit={handleSignIn}  className="">
                <h2 className="">Sign In Brother!</h2>
                <p>
                   Don't have an account? <Link to="/SignUp">Sign Up!</Link>
                </p>
                <div className="up_div">
                    {/*Email*/}
                    <input 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="up_email"
                        placeholder="Email" 
                        type="email">
                    </input> 
                    {/*Password*/}
                    <input onChange={(e) => setPassword(e.target.value)} 
                        className="up_pass" 
                        placeholder="Password" 
                        type="password">
                    </input> 
                
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="up_button"> Sign In 
                    </button> {/* Set button to check whether both pass are the same */}

                {error && <p className="error">{error}</p>}
                </div>
            </form>
        </div>
        </>
    )
}