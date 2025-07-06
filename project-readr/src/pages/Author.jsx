import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Author.css';

const Author = () => {
    const [authorData, setAuthorData] = useState(null);
    const [authorWorks, setAuthorWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAllWorks, setShowAllWorks] = useState(false);
    const location = useLocation();

    const navigate = useNavigate();
    const handleBack = () => {
        navigate(-1); // Go back one step in the browser history
    };

    useEffect(() => {
        const fetchAuthorData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get author name from navigation state or localStorage
                let authorName = location.state?.authorName;
                
                if (!authorName) {
                    // Try to get from selected book data
                    const selectedBookData = localStorage.getItem('selectedBook');
                    if (selectedBookData) {
                        const book = JSON.parse(selectedBookData);
                        if (book.author_name && Array.isArray(book.author_name)) {
                            authorName = book.author_name[0];
                        }
                    }
                }

                if (!authorName) {
                    setError('No author selected');
                    setLoading(false);
                    return;
                }

                // Search for author details
                const encodedAuthor = encodeURIComponent(authorName);
                const searchResponse = await fetch(
                    `https://openlibrary.org/search/authors.json?q=${encodedAuthor}&limit=1`
                );

                if (!searchResponse.ok) {
                    throw new Error('Failed to fetch author data');
                }

                const searchData = await searchResponse.json();
                
                if (searchData.docs && searchData.docs.length > 0) {
                    const authorInfo = searchData.docs[0];
                    console.log('Author info from search:', authorInfo);
                    
                    // Set the basic author data first
                    setAuthorData(authorInfo);
                    
                    // Fetch full author details to get biography
                    if (authorInfo.key) {
                        await fetchFullAuthorData(authorInfo.key);
                        await fetchAuthorWorks(authorInfo.key);
                    } else {
                        // No key found, try to get works by author name
                        await fetchBooksByAuthor(authorName);
                    }
                } else {
                    console.log('No author found in search results');
                    // If no author found in authors endpoint, create basic info
                    setAuthorData({
                        name: authorName,
                        key: null
                    });
                    await fetchBooksByAuthor(authorName);
                }

            } catch (error) {
                console.error('Error fetching author data:', error);
                setError('Failed to load author information');
            } finally {
                setLoading(false);
            }
        };

        fetchAuthorData();
    }, [location.state]);

    const fetchFullAuthorData = async (authorKey) => {
        try {
            // Construct the correct URL - key should be in format like "OL23919A"
            let apiUrl;
            if (authorKey.startsWith('/authors/')) {
                // If key is like "/authors/OL23919A", use it as is
                apiUrl = `https://openlibrary.org${authorKey}.json`;
            } else if (authorKey.startsWith('OL')) {
                // If key is like "OL23919A", add the authors prefix
                apiUrl = `https://openlibrary.org/authors/${authorKey}.json`;
            } else {
                // Fallback for other formats
                apiUrl = `https://openlibrary.org/authors/${authorKey}.json`;
            }

            console.log('Fetching author data from:', apiUrl);
            const authorResponse = await fetch(apiUrl);

            if (authorResponse.ok) {
                const fullAuthorData = await authorResponse.json();
                setAuthorData(fullAuthorData);
            } else {
                console.error('Author API response not ok:', authorResponse.status);
                // Fallback to basic author data from search
                setAuthorData(prevData => prevData);
            }
        } catch (error) {
            console.error('Error fetching full author data:', error);
            // Don't fail completely, keep the basic author data
        }
    };

    const fetchAuthorWorks = async (authorKey) => {
        try {
            // Construct the correct URL for works
            let apiUrl;
            if (authorKey.startsWith('/authors/')) {
                // If key is like "/authors/OL23919A", use it as is
                apiUrl = `https://openlibrary.org${authorKey}/works.json?limit=100`;
            } else if (authorKey.startsWith('OL')) {
                // If key is like "OL23919A", add the authors prefix
                apiUrl = `https://openlibrary.org/authors/${authorKey}/works.json?limit=100`;
            } else {
                // Fallback for other formats
                apiUrl = `https://openlibrary.org/authors/${authorKey}/works.json?limit=100`;
            }

            console.log('Fetching works from:', apiUrl);
            const worksResponse = await fetch(apiUrl);

            if (worksResponse.ok) {
                const worksData = await worksResponse.json();
                if (worksData.entries && Array.isArray(worksData.entries)) {
                    setAuthorWorks(worksData.entries);
                } else {
                    console.log('No works entries found in response');
                }
            } else {
                console.error('Works API response not ok:', worksResponse.status);
            }
        } catch (error) {
            console.error('Error fetching author works:', error);
        }
    };

    const fetchBooksByAuthor = async (authorName) => {
        try {
            const encodedAuthor = encodeURIComponent(authorName);
            const booksResponse = await fetch(
                `https://openlibrary.org/search.json?author=${encodedAuthor}&limit=100&sort=rating`
            );

            if (booksResponse.ok) {
                const booksData = await booksResponse.json();
                if (booksData.docs) {
                    // Convert search results to works format
                    const works = booksData.docs.map(book => ({
                        title: book.title,
                        first_publish_year: book.first_publish_year,
                        key: book.key,
                        cover_id: book.cover_i
                    }));
                    setAuthorWorks(works);
                }
            }
        } catch (error) {
            console.error('Error fetching books by author:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        // Handle different date formats from OpenLibrary
        if (typeof dateString === 'string') {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
        return dateString;
    };

    const getAuthorPhoto = (authorKey) => {
        if (!authorKey) return null;
        
        // Extract the author ID from the key
        let authorId;
        if (authorKey.startsWith('/authors/')) {
            authorId = authorKey.replace('/authors/', '');
        } else if (authorKey.startsWith('OL')) {
            authorId = authorKey;
        } else {
            authorId = authorKey;
        }
        
        return `https://covers.openlibrary.org/a/olid/${authorId}-M.jpg`;
    };

    const getBioText = (bio) => {
        if (!bio) return 'No biography available.';
        
        // Handle different bio formats from OpenLibrary
        if (typeof bio === 'string') {
            return bio;
        } else if (typeof bio === 'object') {
            // Handle OpenLibrary's type/value format
            if (bio.type === '/type/text' && bio.value) {
                return bio.value;
            } else if (bio.value) {
                return bio.value;
            } else if (Array.isArray(bio) && bio.length > 0) {
                // Sometimes bio is an array
                return bio[0].value || bio[0];
            }
        }
        
        return 'No biography available.';
    };

    const toggleShowAllWorks = () => {
        setShowAllWorks(!showAllWorks);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading author information...</p>
                </div>
            </div>
        );
    }

    if (error || !authorData) {
        return (
            <div className="error-message">
                <h3>Error</h3>
                <p>{error || 'Failed to load author information'}</p>
            </div>
        );
    }

    const authorName = authorData.name || 'Unknown Author';
    const birthDate = formatDate(authorData.birth_date);
    const deathDate = formatDate(authorData.death_date);
    const bio = getBioText(authorData.bio);
    const alternateNames = authorData.alternate_names || [];
    
    // Determine how many works to show
    const worksToShow = showAllWorks ? authorWorks : authorWorks.slice(0, 20);
    const hasMoreWorks = authorWorks.length > 20;

    return (
        <div className="author-page">
            <div className="author-container">
                <button onClick={handleBack} className="back-btn">
                    ← Go Back
                </button>
                
                <div className="author-detail-header">
                    <div className="author-photo-container">
                        {authorData.key ? (
                            <>
                                <img
                                    src={getAuthorPhoto(authorData.key)}
                                    alt={`Photo of ${authorName}`}
                                    className="author-photo"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="author-photo-placeholder" style={{ display: 'none' }}>
                                    👤
                                </div>
                            </>
                        ) : (
                            <div className="author-photo-placeholder">👤</div>
                        )}
                    </div>
                    
                    <div className="author-detail-info">
                        <div className="author-header-top">
                            <h1 className="author-name">{authorName}</h1>
                        </div>
                        
                        {(birthDate || deathDate) && (
                            <div className="author-dates">
                                {birthDate || 'Unknown'} {deathDate ? ` - ${deathDate}` : ''}
                            </div>
                        )}
                        
                        <div className="author-meta">
                            <div className="meta-item">
                                <span className="label">Known Works</span>
                                <span className="value">
                                    {authorWorks.length} book{authorWorks.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {alternateNames.length > 0 && (
                                <div className="meta-item">
                                    <span className="label">Also Known As</span>
                                    <span className="value">{alternateNames.slice(0, 3).join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="author-section">
                    <h3>📝 Biography</h3>
                    <p>{bio}</p>
                </div>

                {authorWorks.length > 0 && (
                    <div className="author-section">
                        <h3>📚 Notable Works</h3>
                        <ul className="works-list">
                            {worksToShow.map((work, index) => (
                                <li key={index}>
                                    <strong>{work.title}</strong>
                                    {work.first_publish_year && <span> ({work.first_publish_year})</span>}
                                </li>
                            ))}
                        </ul>
                        
                        {hasMoreWorks && (
                            <div className="works-toggle">
                                <button 
                                    onClick={toggleShowAllWorks}
                                    className="toggle-works-btn"
                                >
                                    {showAllWorks 
                                        ? 'Show Less' 
                                        : `Show All ${authorWorks.length} Works`
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Author;