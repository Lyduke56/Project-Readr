import { Link, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import "./HomepageNavbar.css"

export function HomepageNavbar() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const handleClick = () => {
        navigate('/Profile');
    };
    
    const handleBackClick = () => {
        navigate('/Homepage');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleDropdownOptionClick = (option) => {
        console.log(`${option} clicked`);
        setIsDropdownOpen(false);
        
        // Navigate to different routes based on option
        switch(option) {
            case 'Top Rated Books':
                navigate('/top-rated-books');
                break;
            case 'My Reading List':
                navigate('/ReadingList');
                break;
            case 'Open Online Forum':
                navigate('/forum');
                break;
            case 'Book Recommendations':
                navigate('/recommendations');
                break;
            default:
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const dropdownOptions = [
        'Top Rated Books',
        'My Reading List', 
        'Open Online Forum',
        'Book Recommendations'
    ];

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
                        <div className="group" ref={dropdownRef}>
                            <div className="overlap-group-2" onClick={toggleDropdown}>
                                <div className="text-wrapper-18">chaechae143</div>
                                <img 
                                    className={`icon dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} 
                                    alt="Dropdown icon" 
                                    src="down.png" 
                                />
                            </div>
                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    {dropdownOptions.map((option, index) => (
                                        <div 
                                            key={index}
                                            className="dropdown-item"
                                            onClick={() => handleDropdownOptionClick(option)}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            )}
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