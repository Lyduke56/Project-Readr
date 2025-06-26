import React, { useState, useEffect, useRef } from 'react';
import './Homepage.css';
import { Link } from 'react-router-dom';

export const Homepage = () => {
  // State for different sections
  const [topRatedBooks, setTopRatedBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Ref for recommendations scroll container
  const recommendationsRef = useRef(null);

  // Mock data structure - replace with actual API calls
  const mockTopRatedBooks = [
    {
      id: 1,
      rank: 1,
      title: "1984",
      author: "Orwell, George",
      users: "251,320 Users",
      score: 9.50,
      userScore: 10,
      status: "COMPLETED"
    },
    {
      id: 2,
      rank: 2,
      title: "The Great Gatsby",
      author: "Fitzgerald, F. Scott",
      users: "201,587 Users",
      score: 9.48,
      userScore: 9,
      status: "COMPLETED"
    },
    {
      id: 3,
      rank: 3,
      title: "The Metamorphosis",
      author: "Kafka, Franz",
      users: "285,301 Users",
      score: 9.24,
      userScore: 10,
      status: "COMPLETED"
    },
    {
      id: 4,
      rank: 4,
      title: "Les Miserables",
      author: "Hugo, Victor",
      users: "220,464 Users",
      score: 9.21,
      userScore: 9,
      status: "COMPLETED"
    },
    {
      id: 5,
      rank: 5,
      title: "To Kill a Mockingbird",
      author: "Lee, Harper",
      users: "123,456 Members",
      score: 9.20,
      userScore: 9,
      status: "COMPLETED"
    }
  ];

  const mockRecommendedBooks = [
    { id: 1, title: "[Title]", author: "[Author]" },
    { id: 2, title: "[Title]", author: "[Author]" },
    { id: 3, title: "[Title]", author: "[Author]" },
    { id: 4, title: "[Title]", author: "[Author]" },
    { id: 5, title: "[Title]", author: "[Author]" },
    { id: 6, title: "[Title]", author: "[Author]" },
    { id: 7, title: "[Title]", author: "[Author]" },
    { id: 8, title: "[Title]", author: "[Author]" },
    { id: 9, title: "[Title]", author: "[Author]" },
    { id: 10, title: "[Title]", author: "[Author]" },
    { id: 11, title: "[Title]", author: "[Author]" },
    { id: 12, title: "[Title]", author: "[Author]" }
  ];

  // Simulate API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Replace these with actual API calls
        setTopRatedBooks(mockTopRatedBooks);
        setRecommendedBooks(mockRecommendedBooks);
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

  // API integration functions - replace with actual implementations
  const fetchTopRatedBooks = async () => {
    // Replace with actual API call
    // const response = await fetch('/api/books/top-rated');
    // const data = await response.json();
    // setTopRatedBooks(data);
  };

  const fetchRecommendedBooks = async () => {
    // Replace with actual API call
    // const response = await fetch('/api/books/recommended');
    // const data = await response.json();
    // setRecommendedBooks(data);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    // Replace with actual search API call
    // const response = await fetch(`/api/books/search?q=${query}&type=${activeTab}`);
    // const results = await response.json();
    // Handle search results
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Trigger search with new tab if there's a query
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleStatusChange = async (bookId, newStatus) => {
    // Replace with actual API call to update book status
    // const response = await fetch(`/api/books/${bookId}/status`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status: newStatus })
    // });
    
    // Update local state
    setTopRatedBooks(prev => 
      prev.map(book => 
        book.id === bookId ? { ...book, status: newStatus } : book
      )
    );
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
      

      {/* Navigation Tabs */}
      <div className="navigation-section">
        <div className="container">
          <div className="navigation-content">
            <div className="tab-buttons">
              {['Books', 'Authors', 'Discover'].map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="search-controls">
              <select 
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
                className="filter-select"
              >
                <option value="All">All</option>
                <option value="Books">Books</option>
                <option value="Authors">Authors</option>
              </select>
              
              <input
                type="text"
                placeholder="Search Books, Authors, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="search-input"
              />
            </div>
          </div>
        </div>
      </div>

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
                {recommendedBooks.map(book => (
                  <RecommendationCard key={book.id} book={book} />
                ))}
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

          <Link to="/Author" className="author-link">Author</Link>
          <br />
          <Link to="/Book" className="book-link">Book</Link>
        </div>
      </div>

      <></>

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
              {topRatedBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;