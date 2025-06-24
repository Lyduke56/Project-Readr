import { Link, useNavigate } from "react-router-dom"
import "./HomepageNavbar.css"

export function HomepageNavbar() {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate('/Profile');
    };
    
    const handleBackClick = () => {
        navigate('/Homepage');
    };

    return (
        <>
            <div className="welcome-navbar">
                <div className="nav-left">
                    <h1>Readr</h1>
                </div>

                <div className="nav-right">
                    <div className="overlap-2">
                        <button className="icon-button" onClick={handleBackClick}>
                            <img className="icon" alt="Arrow icon" src="arrow.png" />
                        </button>
                        <button className="icon-button" onClick={() => console.log('Iconclicked')}>
                            <img className="icon" alt="Bell icon" src="bell.png" />
                        </button>
                        <div className="group">
                            <div className="overlap-group-2">
                                <div className="text-wrapper-18">chaechae143</div>
                                     <img className="icon" alt="Dropdown icon" src="down.png" />
                            </div>
                        </div>
                        <button onClick={handleClick}>
                        <img className="mask-group" alt="Profile picture" src="Chaewon.png" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}