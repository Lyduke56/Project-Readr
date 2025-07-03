import { Link } from "react-router-dom"
import './WelcomePage.css'
import RotatingText from "../Animations/RotatingText"
import { motion } from "framer-motion"

export function WelcomePage(){
    return (
        <>
            <div className="welcome-hero">
                <div className="left-div">
                    <h1>Welcome to <span>Readr</span></h1>
                    
                        <motion.div className="WPtext-animation" layout>
                            <span className="wp-static-text">Find books to </span>
                            <RotatingText
                                texts={['Swipe', 'Shelve', 'Read']}
                                mainClassName="rotating-text-bg"
                                staggerFrom={"last"}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "-120%" }}
                                staggerDuration={0.025}
                                splitLevelClassName="rotating-text-word"
                                transition={{ 
                                    type: "spring", 
                                    damping: 30, 
                                    stiffness: 400
                                }}
                                rotationInterval={2000}
                            />
                        </motion.div>
            
                        <div className="hero-buttons">
                            <Link to="/SignIn">
                            <button className="sign-in-btn">Sign In</button>
                            </Link>
                            <Link to="/SignUp">
                            <button className="get-started-btn">Get Started</button>
                            </Link>
                        </div>
                    
                </div>
            </div>
        </>
    )
}