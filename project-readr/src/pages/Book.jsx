import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import x31493481 from "/Element.png";
import { HomepageNavbar } from "../components/HomepageNavbar";
import image6 from "/LibraryPic.png";
import "./Book.css";

export const Book = () => {
  const { bookId } = useParams(); // Get book ID from URL params
  const [bookData, setBookData] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState(0);
  const [status, setStatus] = useState('PLAN_TO_READ');
  const [error, setError] = useState(null);

  // API integration functions
  const fetchBookData = async (id) => {
    try {
      const response = await fetch(`/api/books/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch book data');
      }
      const data = await response.json();
      setBookData(data);
      
      // Set initial user score and status if available in book data
      if (data.userScore !== undefined) {
        setUserScore(data.userScore);
      }
      if (data.userStatus) {
        setStatus(data.userStatus);
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
      setError(error.message);
      setBookData(null);
    }
  };

  const fetchUserReviews = async (id) => {
    try {
      const response = await fetch(`/api/books/${id}/reviews`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setUserReviews(data);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      setUserReviews([]);
    }
  };

  // Fetch data on component mount or when bookId changes
  useEffect(() => {
    const fetchData = async () => {
      if (!bookId) {
        setError('No book ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchBookData(bookId),
          fetchUserReviews(bookId)
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load book information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookId]);

  const handleStatusChange = async (newStatus) => {
    if (!bookData) return;

    try {
      const response = await fetch(`/api/books/${bookData.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      // Optionally show error message to user
    }
  };

  const handleScoreChange = async (newScore) => {
    if (!bookData) return;

    try {
      const response = await fetch(`/api/books/${bookData.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: newScore })
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      setUserScore(newScore);
    } catch (error) {
      console.error('Error updating score:', error);
      // Optionally show error message to user
    }
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

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Error Loading Book</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Book Not Found</h2>
          <p>The requested book could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="book-page">
      <div className="book-container">
        <div className="book-detail-header">
          <img 
            className="book-detail-cover" 
            alt={`${bookData.title} cover`} 
            src={bookData.coverImage || x31493481} 
          />
          <div className="book-detail-info">
            <h1>{bookData.title}</h1>
            <div className="authors">by {bookData.author}</div>
            <div className="meta">
              <div className="meta-item emphasized">
                <div className="label">Score</div>
                <div className="value">{bookData.score}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Rank</div>
                <div className="value">#{bookData.rank}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Popularity</div>
                <div className="value">#{bookData.popularity}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Users</div>
                <div className="value">{bookData.users}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Edition count</div>
                <div className="value">{bookData.editionCount}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Year Published</div>
                <div className="value">{bookData.yearPublished}</div>
              </div>
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
                  <option key={score} value={score}>Score: {score}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="description">
          <h3>Synopsis</h3>
          <p>{bookData.synopsis || 'No synopsis available.'}</p>
        </div>

        <div className="subjects">
          <h3>Subjects</h3>
          <p>{bookData.genres || 'No genres specified.'}</p>
        </div>

        <div className="book-reviews">
          <h3>User Reviews</h3>
          {userReviews.length > 0 ? (
            userReviews.map(review => (
              <div key={review.id} className="book-review">
                <div className="book-review-user">{review.username}</div>
                <p className="book-review-text">{review.comment}</p>
                <div className="book-review-score">{review.score}/10</div>
              </div>
            ))
          ) : (
            <div className="no-reviews">
              <p>No reviews available for this book yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};