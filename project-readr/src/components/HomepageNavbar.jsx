import { useNavigate, useLocation  } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { supabase } from '../supabaseClient';
import "./HomepageNavbar.css"

export function HomepageNavbar() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();


    const handleClick = () => {
        navigate('/Profile');
    };
    
    const handleBackClick = () => {
        navigate('/Home');
    };

    const handleReadrClick = () => {
        if (session) {
            navigate('/Home');
        } else {
            navigate('/WelcomePage');
        }
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
                navigate('/Homepage');
                break;
            case 'My Reading List':
                navigate('/ReadingList');
                break;
            case 'Discover New Books':
                navigate('/Discover');
                break;
            default:
                break;
        }
    };

    const [session, setSession] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const user = session?.user;

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };

        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

            if (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data');
            } else {
            setProfileData(data);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
        };

        fetchProfile();
    }, [user?.id]);


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
        'Discover New Books'
    ];

    return (
        <>
            <div className="welcome-navbar">
                <div className="nav-left">
                    <h1 onClick={handleReadrClick} style={{ cursor: 'pointer' }}>Readr</h1>
                </div>

                <div className="nav-right">
                    <div className="overlap-2">

                        {location.pathname !== '/Home' && (
                            <button className="icon-button" onClick={handleBackClick}>
                                <img className="icon" alt="Arrow icon" src="arrow.png" />
                            </button>
                        )}

                        <button className="icon-button" onClick={() => console.log('Iconclicked')}>
                            <img className="icon" alt="Bell icon" src="bell.png" />
                        </button>
                        
                        <div className="group" ref={dropdownRef}>
                            <div className="overlap-group-2" onClick={toggleDropdown}>
                                <div className="text-wrapper-18">{profileData?.display_name || "User"}</div>
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
               {loading ? (
                            <p>Loading...</p>
                        ) : (
                            profileData && (
                                <button onClick={handleClick} className="mask-group">
                                    <img 
                                        src={profileData.profile_image} 
                                        alt={`${profileData.display_name || profileData.full_name}'s avatar`}
                                        className="mask-group"
                                    />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
