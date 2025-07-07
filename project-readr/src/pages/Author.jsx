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
        navigate(-1);
    };

    const handleWorkClick = (work) => {
        // Navigate to home page with work title search parameters
        navigate('../Home', { 
            state: { 
                searchTerm: work.title,
                autoSearch: true,
                displaySearchTerm: work.title,
                filterBy: 'Title'
            },
            replace: false // Set to true if you don't want this navigation in history
        });
        
        // Reset scroll position after navigation
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 0);
    };

    useEffect(() => {
        const fetchAuthorData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get author data from navigation state
                let authorName = location.state?.authorName;
                let authorKey = location.state?.authorKey;
                
                // Check if we have author data from the book search results (your old format)
                if (location.state?.bookData) {
                    const bookData = location.state.bookData;
                    if (bookData.author_name && Array.isArray(bookData.author_name)) {
                        authorName = bookData.author_name[0];
                    }
                    if (bookData.author_key && Array.isArray(bookData.author_key)) {
                        authorKey = bookData.author_key[0];
                    }
                }

                // Fallback to localStorage
                if (!authorName) {
                    const selectedBookData = localStorage.getItem('selectedBook');
                    if (selectedBookData) {
                        const book = JSON.parse(selectedBookData);
                        if (book.author_name && Array.isArray(book.author_name)) {
                            authorName = book.author_name[0];
                            authorKey = book.author_key ? book.author_key[0] : null;
                        } else if (book.authorName) {
                            // Handle your new format
                            authorName = book.authorName;
                            authorKey = book.authorKey;
                        }
                    }
                }

                if (!authorName) {
                    setError('No author selected');
                    setLoading(false);
                    return;
                }

                console.log('Processing author:', { authorName, authorKey });

                // Create initial author data
                const initialAuthorData = {
                    name: authorName,
                    key: authorKey
                };

                // Set initial data immediately
                setAuthorData(initialAuthorData);

                // If we have a key, try to get more detailed information
                if (authorKey) {
                    await fetchFullAuthorData(authorKey, initialAuthorData);
                    await fetchAuthorWorks(authorKey);
                } else {
                    // No key found, search for author and get works by name
                    const searchResult = await searchForAuthor(authorName);
                    if (searchResult) {
                        const foundAuthorData = {
                            ...initialAuthorData,
                            key: searchResult.key,
                            bio: searchResult.bio || searchResult.biography,
                            birth_date: searchResult.birth_date,
                            death_date: searchResult.death_date,
                            alternate_names: searchResult.alternate_names
                        };
                        setAuthorData(foundAuthorData);
                        await fetchFullAuthorData(searchResult.key, foundAuthorData);
                        await fetchAuthorWorks(searchResult.key);
                    } else {
                        // Fallback to book search
                        await fetchBooksByAuthor(authorName);
                    }
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

    const searchForAuthor = async (authorName) => {
        try {
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
                return authorInfo;
            }
        } catch (error) {
            console.error('Error searching for author:', error);
        }
        return null;
    };

    const fetchFullAuthorData = async (authorKey, currentData) => {
        try {
            // Clean and format the author key
            let cleanKey = authorKey;
            if (cleanKey.startsWith('/authors/')) {
                cleanKey = cleanKey.replace('/authors/', '');
            }
            
            // Ensure the key starts with OL if it doesn't already
            if (!cleanKey.startsWith('OL')) {
                // If the key doesn't start with OL, it might be malformed
                console.warn('Author key might be malformed:', cleanKey);
                setAuthorData(currentData);
                return;
            }

            const apiUrl = `https://openlibrary.org/authors/${cleanKey}.json`;
            console.log('Fetching author data from:', apiUrl);
            
            const authorResponse = await fetch(apiUrl);

            if (authorResponse.ok) {
                const fullAuthorData = await authorResponse.json();
                
                // Merge with existing data
                const mergedData = {
                    ...currentData,
                    ...fullAuthorData,
                    key: cleanKey // Ensure we keep the clean key
                };
                
                setAuthorData(mergedData);
            } else {
                console.error('Author API response not ok:', authorResponse.status);
                setAuthorData(currentData);
            }
        } catch (error) {
            console.error('Error fetching full author data:', error);
            setAuthorData(currentData);
        }
    };

    const fetchAuthorWorks = async (authorKey) => {
        try {
            // Clean the author key
            let cleanKey = authorKey;
            if (cleanKey.startsWith('/authors/')) {
                cleanKey = cleanKey.replace('/authors/', '');
            }
            
            if (!cleanKey.startsWith('OL')) {
                console.warn('Invalid author key for works:', cleanKey);
                return;
            }

            const apiUrl = `https://openlibrary.org/authors/${cleanKey}/works.json?limit=200`;
            console.log('Fetching works from:', apiUrl);
            
            const worksResponse = await fetch(apiUrl);

            if (worksResponse.ok) {
                const worksData = await worksResponse.json();
                if (worksData.entries && Array.isArray(worksData.entries)) {
                    // Process works with simplified popularity scoring
                    const processedWorks = worksData.entries.map(work => ({
                        title: work.title || 'Unknown Title',
                        first_publish_year: work.first_publish_year,
                        key: work.key,
                        subjects: work.subjects || [],
                        // Simple popularity score based on available data
                        popularityScore: calculateSimplePopularity(work)
                    }));
                    
                    setAuthorWorks(processedWorks);
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

    const calculateSimplePopularity = (work) => {
        let score = 0;
        
        // Base score from subjects (more subjects = more notable)
        if (work.subjects && work.subjects.length > 0) {
            score += work.subjects.length * 2;
        }
        
        // Bonus for having a description
        if (work.description) {
            score += 10;
        }
        
        // Bonus for older works (classics tend to be more notable)
        if (work.first_publish_year) {
            const currentYear = new Date().getFullYear();
            const age = currentYear - work.first_publish_year;
            if (age > 50) {
                score += 15; // Classic bonus
            } else if (age > 25) {
                score += 5; // Established work bonus
            }
        }
        
        return score;
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
                    // Convert search results to works format with simple scoring
                    const uniqueTitles = new Set();
                    const works = booksData.docs
                        .filter(book => {
                            const title = book.title?.toLowerCase();
                            if (!title || uniqueTitles.has(title)) {
                                return false;
                            }
                            uniqueTitles.add(title);
                            return true;
                        })
                        .map(book => {
                            // Simple popularity scoring for search results
                            let popularityScore = 0;
                            
                            if (book.ratings_average) {
                                popularityScore += book.ratings_average * 10;
                            }
                            if (book.ratings_count) {
                                popularityScore += Math.min(book.ratings_count / 10, 50);
                            }
                            if (book.want_to_read_count) {
                                popularityScore += Math.min(book.want_to_read_count / 100, 25);
                            }
                            if (book.cover_i) {
                                popularityScore += 10;
                            }
                            
                            return {
                                title: book.title,
                                first_publish_year: book.first_publish_year,
                                key: book.key,
                                cover_id: book.cover_i,
                                subjects: book.subject || [],
                                popularityScore: popularityScore
                            };
                        })
                        .slice(0, 50); // Limit to 50 works
                        
                    setAuthorWorks(works);
                }
            }
        } catch (error) {
            console.error('Error fetching books by author:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
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
        
        // Clean the key
        let cleanKey = authorKey;
        if (cleanKey.startsWith('/authors/')) {
            cleanKey = cleanKey.replace('/authors/', '');
        }
        
        return `https://covers.openlibrary.org/a/olid/${cleanKey}-M.jpg`;
    };

    const getBioText = (bio) => {
        if (!bio) return 'No biography available.';
        
        if (typeof bio === 'string') {
            return bio;
        } else if (typeof bio === 'object') {
            if (bio.type === '/type/text' && bio.value) {
                return bio.value;
            } else if (bio.value) {
                return bio.value;
            } else if (Array.isArray(bio) && bio.length > 0) {
                return bio[0].value || bio[0];
            }
        }
        
        return 'No biography available.';
    };

    // Enhanced function to filter and get most notable works based on popularity
    const getNotableWorks = (works) => {
        if (!works || works.length === 0) return [];
        
        // Remove obvious duplicates and invalid titles
        const filteredWorks = works.filter(work => {
            const title = work.title?.toLowerCase().trim();
            if (!title || title.length < 3) return false;
            
            // Filter out generic/invalid titles
            const invalidTitles = ['untitled', 'unknown', 'test', 'draft', 'temp'];
            return !invalidTitles.some(invalid => title.includes(invalid));
        });
        
        // Remove duplicates based on normalized title
        const uniqueWorks = new Map();
        filteredWorks.forEach(work => {
            const normalizedTitle = work.title
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (!uniqueWorks.has(normalizedTitle) || 
                (work.popularityScore || 0) > (uniqueWorks.get(normalizedTitle).popularityScore || 0)) {
                uniqueWorks.set(normalizedTitle, work);
            }
        });
        
        // Convert back to array and sort by popularity, then by publication year
        return Array.from(uniqueWorks.values())
            .sort((a, b) => {
                // Primary sort: popularity score (higher first)
                const scoreA = a.popularityScore || 0;
                const scoreB = b.popularityScore || 0;
                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }
                
                // Secondary sort: publication year (older first)
                if (a.first_publish_year && b.first_publish_year) {
                    return a.first_publish_year - b.first_publish_year;
                }
                
                // Tertiary sort: alphabetically
                return (a.title || '').localeCompare(b.title || '');
            })
            .slice(0, 50); // Just take the top 50
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
                <button onClick={handleBack} className="back-btn">
                    ← Go Back
                </button>
            </div>
        );
    }

    const authorName = authorData.name || 'Unknown Author';
    const birthDate = formatDate(authorData.birth_date);
    const deathDate = formatDate(authorData.death_date);
    const bio = getBioText(authorData.bio);
    const alternateNames = authorData.alternate_names || [];
    
    // Get notable works (filtered and deduplicated based on popularity)
    const notableWorks = getNotableWorks(authorWorks);
    const worksToShow = showAllWorks ? notableWorks : notableWorks.slice(0, 8);
    const hasMoreWorks = notableWorks.length > 8;

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
                        
                        <div className="author-meta">
                            {(birthDate || deathDate) && (
                                <div className="meta-item">
                                    <span className="label">Born</span>
                                    <span className="value">
                                        {birthDate || 'Unknown'} {deathDate ? ` - ${deathDate}` : ''}
                                    </span>
                                </div>
                            )}
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
                    <h3>Biography</h3>
                    <p className="meta-item">{bio}</p>
                </div>

                {notableWorks.length > 0 && (
                    <div className="author-section">
                        <h3>Notable Works</h3>
                        <ul className="works-list">
                            {worksToShow.map((work, index) => (
                                <li key={index} onClick={() => handleWorkClick(work)} className="work-item">
                                    <strong>{work.title}</strong>
                                    {work.first_publish_year && <span> ({work.first_publish_year})</span>}
                                    {work.popularityScore > 50 && <span className="popular-work"></span>}
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
                                        : `Show More Works (${notableWorks.length - 8} more)`
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