import React, { useState, useEffect, useRef } from 'react';
import './Homepage.css';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

export const Homepage = () => {
  // State for different sections
  const [topRatedBooks, setTopRatedBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [userReadingList, setUserReadingList] = useState([]);
  const [recommendationBasis, setRecommendationBasis] = useState('');

  const navigate = useNavigate();
  const recommendationsRef = useRef(null);
  
  // Get user session for personalized recommendations
  const { session } = UserAuth();
  const user = session?.user;

  // Mock data structure for top rated books (keeping your original data)
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

  // Check if recommendations are already cached for this session
  const getSessionRecommendations = () => {
    try {
      const cached = sessionStorage.getItem('sessionRecommendations');
      const cachedBasis = sessionStorage.getItem('sessionRecommendationBasis');
      
      if (cached && cachedBasis) {
        const recommendations = JSON.parse(cached);
        if (recommendations.length > 0) {
          return {
            recommendations,
            basis: cachedBasis
          };
        }
      }
    } catch (error) {
      console.error('Error reading session recommendations:', error);
    }
    return null;
  };

  // Cache recommendations for this session
  const setSessionRecommendations = (recommendations, basis) => {
    try {
      sessionStorage.setItem('sessionRecommendations', JSON.stringify(recommendations));
      sessionStorage.setItem('sessionRecommendationBasis', basis);
    } catch (error) {
      console.error('Error caching session recommendations:', error);
    }
  };

  // Clear session recommendations (useful for manual refresh)
  const clearSessionRecommendations = () => {
    try {
      sessionStorage.removeItem('sessionRecommendations');
      sessionStorage.removeItem('sessionRecommendationBasis');
    } catch (error) {
      console.error('Error clearing session recommendations:', error);
    }
  };

  // Load user's reading list from localStorage and potentially from API
  const loadUserReadingList = async () => {
    try {
      // Get from localStorage first
      const localReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
      
      // If user is logged in, you can also fetch from your API here
      // const apiReadingList = await fetchUserReadingListFromAPI(user.id);
      
      setUserReadingList(localReadingList);
      return localReadingList;
    } catch (error) {
      console.error('Error loading user reading list:', error);
      return [];
    }
  };

  // Analyze subjects from user's reading list
  const analyzeUserPreferences = (readingList) => {
    const subjectCount = {};
    const authorCount = {};
    
    readingList.forEach(book => {
      // Count subjects
      if (book.subject) {
        const subjects = book.subject.split(', ');
        subjects.forEach(subject => {
          const cleanSubject = subject.trim().toLowerCase();
          subjectCount[cleanSubject] = (subjectCount[cleanSubject] || 0) + 1;
        });
      }
      
      // Count authors for author-based recommendations
      if (book.author) {
        const author = book.author.toLowerCase();
        authorCount[author] = (authorCount[author] || 0) + 1;
      }
    });
    
    // Get top subjects (most common preferences)
    const topSubjects = Object.entries(subjectCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([subject]) => subject);
    
    const topAuthors = Object.entries(authorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author]) => author);
    
    return { topSubjects, topAuthors, subjectCount, authorCount };
  };

  // Generate recommendations based on user preferences
  const generatePersonalizedRecommendations = async (preferences) => {
    const { topSubjects, topAuthors } = preferences;
    const recommendations = [];
    
    try {
      // Search based on top subjects - increased to get more books
      for (const subject of topSubjects.slice(0, 5)) {
        const response = await fetch(
          `https://openlibrary.org/search.json?subject=${encodeURIComponent(subject)}&limit=12&sort=rating`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            // Filter out books already in user's reading list
            const userBookKeys = userReadingList.map(book => book.key);
            const newBooks = data.docs
              .filter(book => !userBookKeys.includes(book.key) && book.cover_i)
              .slice(0, 6);
            
            recommendations.push(...newBooks);
          }
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Search based on top authors for variety - increased to get more books
      for (const author of topAuthors.slice(0, 3)) {
        const response = await fetch(
          `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=8&sort=rating`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            const userBookKeys = userReadingList.map(book => book.key);
            const newBooks = data.docs
              .filter(book => !userBookKeys.includes(book.key) && book.cover_i)
              .slice(0, 4);
            
            recommendations.push(...newBooks);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Remove duplicates and ensure we have exactly 20 books
      const uniqueRecommendations = recommendations
        .filter((book, index, self) => 
          index === self.findIndex(b => b.key === book.key)
        );
      
      // If we have less than 20, fill with additional random searches
      if (uniqueRecommendations.length < 20) {
        const additionalBooks = await generateAdditionalBooks(20 - uniqueRecommendations.length, uniqueRecommendations);
        uniqueRecommendations.push(...additionalBooks);
      }
      
      return uniqueRecommendations.slice(0, 20);
      
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return [];
    }
  };

  // Generate additional books to reach 20 total
  const generateAdditionalBooks = async (needed, existingBooks) => {
    const additionalQueries = [
      'popular fiction',
      'bestseller',
      'award winning',
      'classic literature',
      'contemporary fiction',
      'mystery',
      'romance',
      'science fiction',
      'fantasy',
      'historical fiction',
      'thriller',
      'literary fiction'
    ];
    
    const additionalBooks = [];
    const existingKeys = existingBooks.map(book => book.key);
    const userBookKeys = userReadingList.map(book => book.key);
    const allExistingKeys = [...existingKeys, ...userBookKeys];
    
    try {
      for (const query of additionalQueries) {
        if (additionalBooks.length >= needed) break;
        
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&sort=rating`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            const newBooks = data.docs
              .filter(book => 
                !allExistingKeys.includes(book.key) && 
                book.cover_i && 
                book.title && 
                book.author_name &&
                !additionalBooks.some(existing => existing.key === book.key)
              )
              .slice(0, Math.min(3, needed - additionalBooks.length));
            
            additionalBooks.push(...newBooks);
            allExistingKeys.push(...newBooks.map(book => book.key));
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return additionalBooks;
      
    } catch (error) {
      console.error('Error generating additional books:', error);
      return [];
    }
  };

  // Generate random recommendations as fallback
  const generateRandomRecommendations = async () => {
    const randomQueries = [
      'fiction bestseller',
      'mystery thriller',
      'romance novel',
      'science fiction',
      'fantasy adventure',
      'historical fiction',
      'literary fiction',
      'contemporary fiction',
      'classic literature',
      'award winning books',
      'popular fiction',
      'modern classics'
    ];
    
    const recommendations = [];
    
    try {
      // Use more queries to ensure we get 20 books
      for (const query of randomQueries) {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&sort=rating`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            const booksWithCovers = data.docs
              .filter(book => book.cover_i && book.title && book.author_name)
              .slice(0, 3);
            
            recommendations.push(...booksWithCovers);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Remove duplicates and ensure exactly 20 books
      const uniqueRecommendations = recommendations
        .filter((book, index, self) => 
          index === self.findIndex(b => b.key === book.key)
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);
      
      return uniqueRecommendations;
      
    } catch (error) {
      console.error('Error generating random recommendations:', error);
      return [];
    }
  };

  // Main recommendation loading function - modified for session caching
  const loadRecommendations = async (forceRefresh = false) => {
    setRecommendationsLoading(true);
    
    try {
      // Check if we have cached recommendations for this session (unless forcing refresh)
      if (!forceRefresh) {
        const cached = getSessionRecommendations();
        if (cached) {
          setRecommendedBooks(cached.recommendations);
          setRecommendationBasis(cached.basis);
          setRecommendationsLoading(false);
          console.log('Loaded cached recommendations for this session');
          return;
        }
      }
      
      // If no cached recommendations or forcing refresh, generate new ones
      const readingList = await loadUserReadingList();
      
      let recommendations = [];
      let basis = '';
      
      if (readingList.length > 0) {
        // User has books in their reading list - generate personalized recommendations
        const preferences = analyzeUserPreferences(readingList);
        recommendations = await generatePersonalizedRecommendations(preferences);
        
        // Set recommendation basis message
        if (preferences.topSubjects.length > 0) {
          basis = `Based on your interest in: ${preferences.topSubjects.slice(0, 3).join(', ')}`;
        } else {
          basis = 'Based on your reading history';
        }
        
        console.log('Generated personalized recommendations based on:', preferences);
      }
      
      // If no personalized recommendations or user has no reading list, use random
      if (recommendations.length === 0) {
        recommendations = await generateRandomRecommendations();
        basis = 'Discover new books across different genres';
      }
      
      // Ensure exactly 20 recommendations
      if (recommendations.length < 20 && readingList.length === 0) {
        const additional = await generateRandomRecommendations();
        recommendations = [...recommendations, ...additional]
          .filter((book, index, self) => 
            index === self.findIndex(b => b.key === book.key)
          )
          .slice(0, 20);
      }
      
      // Cache recommendations for this session
      setSessionRecommendations(recommendations, basis);
      
      setRecommendedBooks(recommendations);
      setRecommendationBasis(basis);
      
      console.log('Generated and cached new recommendations for this session');
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback to random recommendations
      const fallbackRecs = await generateRandomRecommendations();
      const fallbackBasis = 'Discover new books across different genres';
      
      setSessionRecommendations(fallbackRecs, fallbackBasis);
      setRecommendedBooks(fallbackRecs);
      setRecommendationBasis(fallbackBasis);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load recommendations (will use cached if available)
        await loadRecommendations();
        
        // Load top rated books (your existing logic)
        await new Promise(resolve => setTimeout(resolve, 500));
        setTopRatedBooks(mockTopRatedBooks);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Removed user dependency to prevent reloading on user change

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

  // Handle book card click
  const handleRecommendationClick = (book) => {
    localStorage.setItem('selectedBook', JSON.stringify(book));
    navigate('/Book');
  };

  // Handle add to reading list - modified to offer refresh option
  const handleAddToReadingList = async (e, book) => {
    e.stopPropagation();
    
    const title = book.title?.trim() || "No title available";
    const author = Array.isArray(book.author_name) && book.author_name.length > 0
      ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
      : "Unknown author";

    // Get existing reading list
    let readingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    const bookToAdd = {
      title: title,
      author: author,
      key: book.key,
      cover_id: book.cover_i,
      publish_year: book.first_publish_year,
      subject: book.subject ? book.subject.slice(0, 5).join(", ") : null
    };
    
    // Check if book is already in reading list
    const exists = readingList.some(item => item.key === book.key);
    if (!exists) {
      readingList.push(bookToAdd);
      localStorage.setItem('readingList', JSON.stringify(readingList));
      
      // Clear session cache since reading list changed
      clearSessionRecommendations();
      
      // Offer to refresh recommendations
      const shouldRefresh = window.confirm(
        'Added to reading list! Would you like to refresh recommendations based on your updated reading list? (This will happen automatically next session)'
      );
      
      if (shouldRefresh) {
        loadRecommendations(true); // Force refresh
      }
    } else {
      alert('Book already in reading list!');
    }

    // If you have API integration, add the Supabase logic here similar to your second script
  };

  // Modified refresh function to force new recommendations
  const handleRefreshRecommendations = () => {
    clearSessionRecommendations();
    loadRecommendations(true); // Force refresh
  };


  const handleSearch = async (query) => {
    if (!query.trim()) return;

    navigate('/search', {
      state: {
        query: query.trim(),
        filter: activeTab,
      },
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleStatusChange = async (bookId, newStatus) => {
    setTopRatedBooks(prev => 
      prev.map(book => 
        book.id === bookId ? { ...book, status: newStatus } : book
      )
    );
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
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

  const RecommendationCard = ({ book }) => {
    const title = book.title?.trim() || "No title available";
    const author = Array.isArray(book.author_name) && book.author_name.length > 0
      ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
      : "Unknown author";
    const coverId = book.cover_i?.toString().trim() ? book.cover_i : null;

    return (
      <div className="recommendation-card" onClick={() => handleRecommendationClick(book)}>
            <div className="recommendation-cover">
              {coverId ? (
                <img 
                  src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
                  alt={`Cover of ${title}`} 
                  className="cover-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="cover-placeholder" style={{ display: coverId ? 'none' : 'flex' }}>
                <span>Book Cover</span>
              </div>
            </div>

        <div className="recommendation-info">
          <div className='recommendation-text-group'>
            <h4 className="recommendation-title" title={title}>
              {truncateText(title, 35)}
            </h4>
            <p className="recommendation-author" title={author}>
              by {truncateText(author, 30)}
            </p>
          </div>

          <button 
            className="add-to-list-btn-small"
            onClick={(e) => handleAddToReadingList(e, book)}
          >
            Add to List
          </button>
        </div>
      </div>
    );
  };

  // Loading component for recommendations - now shows 20 skeletons
  const RecommendationSkeleton = () => (
    <div className="recommendation-card loading">
      <div className="recommendation-cover loading-placeholder">
        <span>Loading...</span>
      </div>
      <div className="recommendation-info">
        <div className="loading-text"></div>
        <div className="loading-text short"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your personalized homepage...</p>
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
            <div className="rtab-buttons">
              {['Books', 'Authors', 'Discover'].map(tab => (
                <button
                  key={tab}
                  onClick={() => tab === 'Discover' ? navigate('/Discover') : handleTabChange(tab)}
                  className={`rtab-button ${activeTab === tab ? 'active' : ''}`}
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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="recommendations-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {userReadingList.length > 0 ? 'Recommended for You' : 'Discover New Books'}
            </h2>
            {recommendationBasis && (
              <p className="recommendation-basis">{recommendationBasis}</p>
            )}
          </div>
          
          <div className="recommendations-container">
            <button 
              className="scroll-button left" 
              onClick={scrollLeft}
              aria-label="Scroll left"
              disabled={recommendationsLoading}
            >
              &#8249;
            </button>
            
            <div className="recommendations-scroll-wrapper">
              <div className="recommendations-grid" ref={recommendationsRef}>
                {recommendationsLoading ? (
                  // Show 20 loading skeletons
                  [...Array(20)].map((_, index) => (
                    <RecommendationSkeleton key={index} />
                  ))
                ) : (
                  // Show actual recommendations (should be 20)
                  recommendedBooks.map(book => (
                    <RecommendationCard key={book.key} book={book} />
                  ))
                )}
              </div>
            </div>
            
            <button 
              className="scroll-button right" 
              onClick={scrollRight}
              aria-label="Scroll right"
              disabled={recommendationsLoading}
            >
              &#8250;
            </button>
          </div>
          
          {/* Refresh recommendations button - modified text */}
          <div className="refresh-recommendations">
            <button 
              onClick={handleRefreshRecommendations}
              className="refresh-button"
              disabled={recommendationsLoading}
            >
              {recommendationsLoading ? 'Updating...' : 'Get New Recommendations'}
            </button>
          </div>
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