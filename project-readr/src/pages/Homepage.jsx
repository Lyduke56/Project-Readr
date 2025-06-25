import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

export const Homepage = () => {
  // State for different sections
  const [topRatedBooks, setTopRatedBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Ref for recommendations scroll container
  const recommendationsRef = useRef(null);

  // API integration functions
  const fetchTopRatedBooks = async () => {
    try {
      const response = await fetch('/api/books/top-rated');
      const data = await response.json();
      setTopRatedBooks(data);
    } catch (error) {
      console.error('Error fetching top rated books:', error);
      setTopRatedBooks([]);
    }
  };

  const fetchRecommendedBooks = async () => {
    try {
      const response = await fetch('/api/books/recommended');
      const data = await response.json();
      setRecommendedBooks(data);
    } catch (error) {
      console.error('Error fetching recommended books:', error);
      setRecommendedBooks([]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTopRatedBooks(),
          fetchRecommendedBooks()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll functions for recommendations
  const scrollLeft = () => {
    if (recommendationsRef.current) {
      recommendationsRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (recommendationsRef.current) {
      recommendationsRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      const response = await fetch(`/api/books/search?q=${query}&type=${activeTab}`);
      const results = await response.json();
      // Handle search results - you may want to update state or navigate
      console.log('Search results:', results);
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Trigger search with new tab if there's a query
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleStatusChange = async (bookId, newStatus) => {
    try {
      const response = await fetch(`/api/books/${bookId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        // Update local state
        setTopRatedBooks(prev => 
          prev.map(book => 
            book.id === bookId ? { ...book, status: newStatus } : book
          )
        );
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };

  const BookCard = ({ book }) => (
    <div className="book-card">
      <div className="book-rank">
        <span className="rank-number">{book.rank}</span>
      </div>
      
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <p className="book-users">{book.users}</p>
      </div>
      
      <div className="book-score">
        <span className="score-number">{book.score}</span>
      </div>
      
      <div className="user-score">
        <span className="score-number">{book.userScore}</span>
      </div>
      
      <div className="book-status">
        <button 
          onClick={() => handleStatusChange(book.id, book.status === 'COMPLETED' ? 'READING' : 'COMPLETED')}
          className="status-button"
        >
          {book.status}
        </button>
      </div>
    </div>
  );

  const RecommendationCard = ({ book }) => (
    <div className="recommendation-card">
      <div className="recommendation-cover">
        <span className="cover-placeholder">Book Cover</span>
      </div>
      <h4 className="recommendation-title">{book.title}</h4>
      <p className="recommendation-author">{book.author}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">

      {/* Recommendations Section */}
      <div className="recommendations-section">
        <div className="container">
          <h2 className="section-title">Based on what you've read...</h2>
          <div className="recommendations-container">
            <button 
              className="scroll-button left" 
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              &#8249;
            </button>
            
            <div className="recommendations-scroll-wrapper">
              <div className="recommendations-grid" ref={recommendationsRef}>
                {recommendedBooks.length > 0 ? (
                  recommendedBooks.map(book => (
                    <RecommendationCard key={book.id} book={book} />
                  ))
                ) : (
                  <div className="no-recommendations">
                    <p>No recommendations available</p>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              className="scroll-button right" 
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              &#8250;
            </button>
          </div>

          <div className="overlap-6">
            <div className="text-wrapper-21">All</div>
          </div>

          <Link to="/Book" className="text-wrapper-22">Books</Link>

          <div className="text-wrapper-23">Authors</div>

          <Link to="/Discover" className="text-wrapper-24">Discover</Link>
        </div>
      </div>

      {/* Top Rated Books Section */}
      <div className="top-rated-section">
        <div className="container">
          <div className="top-rated-container">
            <div className="top-rated-header">
              <h2 className="header-title">Top Rated Books</h2>
              <button className="next-button">
                Next 50 →
              </button>
            </div>
            
            {/* Table Header */}
            <div className="table-header">
              <div className="header-rank">RANKING</div>
              <div className="header-title-col">TITLE</div>
              <div className="header-score">SCORE</div>
              <div className="header-user-score">YOUR SCORE</div>
              <div className="header-status">STATUS</div>
            </div>
            
            {/* Book List */}
            <div className="book-list">
              {topRatedBooks.length > 0 ? (
                topRatedBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))
              ) : (
                <div className="no-books">
                  <p>No top rated books available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;