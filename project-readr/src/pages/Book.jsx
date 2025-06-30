import React, { useState, useEffect } from "react";
import "./Book.css";

export const Book = () => {
  const [bookData, setBookData] = useState(null);
  const [workDetails, setWorkDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [status, setStatus] = useState('PLAN_TO_READ');

  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get the selected book from localStorage
        const selectedBookData = localStorage.getItem('selectedBook');
        if (!selectedBookData) {
          setError('No book selected');
          setLoading(false);
          return;
        }

        const book = JSON.parse(selectedBookData);
        setBookData(book);

        // If we have a work key, fetch additional details
        if (book.key) {
          const workKey = book.key.startsWith('/works/') ? book.key : `/works/${book.key.replace('/books/', '')}`;
          
          try {
            const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
            if (workResponse.ok) {
              const workData = await workResponse.json();
              setWorkDetails(workData);
            }
          } catch (workError) {
            console.warn('Could not fetch work details:', workError);
          }
        }

      } catch (error) {
        console.error('Error fetching book data:', error);
        setError('Failed to load book data');
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, []);

  const handleStatusChange = async (newStatus) => {
    // Here you would make an API call to update user's reading status
    // For now, just update local state
    setStatus(newStatus);
    
    // You could also update localStorage or make API call
    console.log(`Status changed to: ${newStatus}`);
  };

  const handleScoreChange = async (newScore) => {
    // Here you would make an API call to update user's score
    // For now, just update local state
    setUserScore(newScore);
    
    // You could also update localStorage or make API call
    console.log(`Score changed to: ${newScore}`);
  };

  const formatSubjects = (subjects) => {
    if (!subjects || !Array.isArray(subjects)) return 'No subjects available';
    return subjects.slice(0, 10).join(', '); // Limit to first 10 subjects
  };

  const formatAuthors = (authors) => {
    if (!authors) return 'Unknown Author';
    if (Array.isArray(authors)) {
      return authors.filter(author => author?.trim()).slice(0, 3).join(', ');
    }
    return authors;
  };

  const getBookCover = (coverId) => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  };

  const getDescription = () => {
    if (workDetails?.description) {
      if (typeof workDetails.description === 'string') {
        return workDetails.description;
      } else if (workDetails.description?.value) {
        return workDetails.description.value;
      }
    }
    return 'No description available for this book.';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading book data...</p>
        </div>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="error-message">
        <h3>Error</h3>
        <p>{error || 'Failed to load book data'}</p>
      </div>
    );
  }

  const title = bookData.title || 'Unknown Title';
  const authors = formatAuthors(bookData.author_name);
  const publishYear = bookData.first_publish_year || bookData.publish_year?.[0] || 'Unknown';
  const coverId = bookData.cover_i;
  const subjects = workDetails?.subjects || bookData.subject || [];
  const editionCount = bookData.edition_count || 'Unknown';

  return (
    <div className="book-page">
      <div className="book-container">
        <div className="book-detail-header">
          <div className="book-cover-container">
            {coverId ? (
              <img 
                className="book-detail-cover" 
                alt={`Cover of ${title}`} 
                src={getBookCover(coverId)}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="book-detail-cover placeholder" 
              style={{ display: coverId ? 'none' : 'flex' }}
            >
              <span>No Cover Available</span>
            </div>
          </div>
          
          <div className="book-detail-info">
            <h1>{title}</h1>
            <div className="authors">by {authors}</div>
            
            <div className="meta">
              <div className="meta-item emphasized">
                <div className="label">Year Published</div>
                <div className="value">{publishYear}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Edition Count</div>
                <div className="value">{editionCount}</div>
              </div>
              {bookData.isbn && (
                <div className="meta-item emphasized">
                  <div className="label">ISBN</div>
                  <div className="value">{Array.isArray(bookData.isbn) ? bookData.isbn[0] : bookData.isbn}</div>
                </div>
              )}
              {bookData.publisher && (
                <div className="meta-item emphasized">
                  <div className="label">Publisher</div>
                  <div className="value">
                    {Array.isArray(bookData.publisher) ? bookData.publisher[0] : bookData.publisher}
                  </div>
                </div>
              )}
            </div>
            
            <div className="book-actions">
              <button 
                onClick={() => handleStatusChange(status === 'PLAN_TO_READ' ? 'READING' : 'PLAN_TO_READ')}
                className="book-action-btn"
              >
                {status === 'PLAN_TO_READ' ? 'Plan to Read' : 'Reading'}
              </button>
              <select 
                value={userScore} 
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                className="book-action-btn"
              >
                {[0,1,2,3,4,5,6,7,8,9,10].map(score => (
                  <option key={score} value={score}>
                    {score === 0 ? 'No Score' : `Score: ${score}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="description">
          <h3>Synopsis</h3>
          <p>{getDescription()}</p>
        </div>

        {subjects.length > 0 && (
          <div className="subjects">
            <h3>Subjects</h3>
            <p>{formatSubjects(subjects)}</p>
          </div>
        )}

        <div className="book-reviews">
          <h3>User Reviews</h3>
          <div className="no-reviews">
            <p>No user reviews available yet. Be the first to write a review!</p>
          </div>
        </div>
      </div>
    </div>
  );
};