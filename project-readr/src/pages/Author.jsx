import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Author.css';

const Author = () => {
    const [authorData, setAuthorData] = useState(null);
    const [authorWorks, setAuthorWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

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
                    setAuthorData(authorInfo);

                    // Fetch author's works
                    if (authorInfo.key) {
                        await fetchAuthorWorks(authorInfo.key);
                    } else {
                        // Fallback: search for books by this author
                        await fetchBooksByAuthor(authorName);
                    }
                } else {
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

    const fetchAuthorWorks = async (authorKey) => {
        try {
            const worksResponse = await fetch(
                `https://openlibrary.org/authors/${authorKey}/works.json?limit=50`
            );

            if (worksResponse.ok) {
                const worksData = await worksResponse.json();
                if (worksData.entries) {
                    setAuthorWorks(worksData.entries);
                }
            }
        } catch (error) {
            console.error('Error fetching author works:', error);
        }
    };

    const fetchBooksByAuthor = async (authorName) => {
        try {
            const encodedAuthor = encodeURIComponent(authorName);
            const booksResponse = await fetch(
                `https://openlibrary.org/search.json?author=${encodedAuthor}&limit=50&sort=rating`
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
        return `https://covers.openlibrary.org/a/olid/${authorKey}-M.jpg`;
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
    const bio = authorData.bio || (typeof authorData.bio === 'object' ? authorData.bio?.value : null) || 'No biography available.';
    const alternateNames = authorData.alternate_names || [];

    return (
        <div className="author-container">
            <div className="author-header">
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
                <div className="author-info">
                    <h1>{authorName}</h1>
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
                        {authorWorks.slice(0, 20).map((work, index) => (
                            <li key={index}>
                                <strong>{work.title}</strong>
                                {work.first_publish_year && ` (${work.first_publish_year})`}
                            </li>
                        ))}
                    </ul>
                    {authorWorks.length > 20 && (
                        <p className="works-note">
                            And {authorWorks.length - 20} more works...
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Author;