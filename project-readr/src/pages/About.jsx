import { useState } from "react"
import { useNavigate } from "react-router-dom" 
import { UserAuth } from "../context/AuthContext"

export function About(){
        const { session, signOut} = UserAuth();
        const navigate = useNavigate(); 

        const handleSignOut = async (e) => {
            e.preventDefault();

            try {
            await signOut();
            navigate("/");
            } catch (err) {
            setError("An unexpected error occurred."); // Catch unexpected errors
            }
        };

        console.log(session); //console for tracking progress/process
    
        return (
        <div>
            <h1>About Readr - Temporary home page</h1>
            <h2> Welcome, {session?.user?.email}</h2>
            <div>
                <a onClick={handleSignOut} className="">Click me to Sign out</a>
            </div>
        </div>
    )
}