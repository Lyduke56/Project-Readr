import { Link, useNavigate } from "react-router-dom"
import "./WelcomeNavbar.css"

export function WelcomeNavbar() {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate("/");
    };

    return(
        <>
            <div className="welcome-navbar">
                <div className="nav-left">
                    <h1 onClick={handleLogoClick} style={{ cursor: 'pointer' }}>Readr</h1>
                </div>

                <div className="nav-right">
                    <Link to="/"> <button className="wnavbar-button">Home</button></Link>
                    <Link to="/Features"> <button className="wnavbar-button">Features</button></Link>
                    <Link to="/About"><button className="wnavbar-button">About Us</button></Link>
                </div>
                
            </div>

            
           
        </>
    )
}
