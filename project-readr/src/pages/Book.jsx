import React, { useState, useEffect } from "react";
import x31493481 from "/Element.png";
import { HomepageNavbar } from "../components/HomepageNavbar";
import image6 from "/LibraryPic.png";
import "./Book.css";

export const Book = () => {
  const [bookData, setBookData] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState(0);
  const [status, setStatus] = useState('PLAN_TO_READ');

  // Mock data structure - replace with actual API calls
  const mockBookData = {
    id: 1,
    title: "Animal Farm",
    author: "Orwell, George",
    genres: "Satire, Fable, Classic Literature, Dystopian Fiction",
    editionCount: "15,320",
    yearPublished: 1945,
    score: 8.98,
    rank: 25,
    popularity: 83,
    users: "125,250",
    synopsis: "In this classic allegorical novella, a group of farm animals band together to create a society where all are equal and free. What begins as a hopeful revolution soon unfolds into a gripping tale of leadership, ideals, and the cost of power. Orwell's sharp and timeless storytelling offers profound insights into society, making Animal Farm a must-read for readers of all ages."
  };

  const mockUserReviews = [
    {
      id: 1,
      username: "imissyoy143",
      score: 9,
      comment: "fun read, very cool actually. ong it cool really awesomesauce ...",
      summary: "it gud"
    }
  ];

  // Simulate API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Replace these with actual API calls
        setBookData(mockBookData);
        setUserReviews(mockUserReviews);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // API integration functions - replace with actual implementations
  const fetchBookData = async (bookId) => {
    // Replace with actual API call
    // const response = await fetch(`/api/books/${bookId}`);
    // const data = await response.json();
    // setBookData(data);
  };

  const fetchUserReviews = async (bookId) => {
    // Replace with actual API call
    // const response = await fetch(`/api/books/${bookId}/reviews`);
    // const data = await response.json();
    // setUserReviews(data);
  };

  const handleStatusChange = async (newStatus) => {
    // Replace with actual API call
    // const response = await fetch(`/api/books/${bookData.id}/status`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status: newStatus })
    // });
    setStatus(newStatus);
  };

  const handleScoreChange = async (newScore) => {
    // Replace with actual API call
    // const response = await fetch(`/api/books/${bookData.id}/score`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ score: newScore })
    // });
    setUserScore(newScore);
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

  if (!bookData) {
    return <div className="error-message">Failed to load book data</div>;
  }

  return (
    <div className="book-page">
      <div className="book-container">
        <div className="book-detail-header">
          <img className="book-detail-cover" alt="Book cover" src={x31493481} />
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
          <p>{bookData.synopsis}</p>
        </div>

        <div className="subjects">
          <h3>Subjects</h3>
          <p>{bookData.genres}</p>
        </div>

        <div className="book-reviews">
          <h3>User Reviews</h3>
          {userReviews.map(review => (
            <div key={review.id} className="book-review">
              <div className="book-review-user">{review.username}</div>
              <p className="book-review-text">{review.comment}</p>
              <div className="book-review-score">{review.score}/10</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};