import React, { useState, useEffect, useRef } from 'react';
import './Homepage.css';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export const Homepage = () => {
  // State for different sections
  const [topRatedBooks, setTopRatedBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [readingListBooks, setReadingListBooks] = useState(new Set());
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [userReadingList, setUserReadingList] = useState([]);
  const [recommendationBasis, setRecommendationBasis] = useState('');

  // Supabase - Userauth
  const { session, insertReadingList } = UserAuth();
  const user = session?.user;

  const navigate = useNavigate();
  const recommendationsRef = useRef(null);

  // Fetch top rated books from Supabase
  const fetchTopRatedBooks = async (isAutoRefresh = false) => {
  try {
    if (isAutoRefresh) {
      console.log("Auto-refreshing top rated books...");
    }
    
    // Get all book ratings with book details
    const { data: ratingsData, error } = await supabase
      .from('book_ratings')
      .select('book_id, rating, book_title, book_author, cover_id, publish_year, subjects');

    if (error) {
      console.error('Error fetching ratings:', error);
      return;
    }

    if (!ratingsData || ratingsData.length === 0) {
      console.log('No ratings found in database');
      setTopRatedBooks([]);
      return;
    }

    // Group ratings by book_id and calculate averages
    const bookRatings = {};
    
    ratingsData.forEach(rating => {
      if (!bookRatings[rating.book_id]) {
        bookRatings[rating.book_id] = {
          book_id: rating.book_id,
          book_title: rating.book_title,
          book_author: rating.book_author,
          cover_id: rating.cover_id,
          publish_year: rating.publish_year, 
          subjects: rating.subjects,
          ratings: [],
          total_ratings: 0,
          average_rating: 0
        };
      }
      bookRatings[rating.book_id].ratings.push(rating.rating);
    });

    // Calculate averages and filter books with minimum ratings
    const processedBooks = Object.values(bookRatings)
      .map(book => {
        const totalRatings = book.ratings.length;
        const averageRating = book.ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;
        
        return {
          ...book,
          total_ratings: totalRatings,
          average_rating: parseFloat(averageRating.toFixed(2))
        };
      })
      .filter(book => book.total_ratings >= 1) // from supabase - function will include books with at least 1 rating
      .sort((a, b) => {
        // Sorter by average rating (descending), then by total ratings (descending) as tiebreaker
        if (b.average_rating !== a.average_rating) {
          return b.average_rating - a.average_rating;
        }
        return b.total_ratings - a.total_ratings;
      })
      .slice(0, 25); // Get top 10 books

    // Format the data for display
    const formattedBooks = processedBooks.map((book, index) => ({
      id: book.book_id,
      rank: index + 1,
      title: book.book_title || 'Unknown Title',
      author: book.book_author || 'Unknown Author',
      users: `${book.total_ratings} Rating${book.total_ratings !== 1 ? 's' : ''}`,
      score: book.average_rating,
      coverID: book.cover_id,
      publish_year: book.publish_year, 
      subjects: book.subjects, 
      userScore: 0,
      status: 'PLAN_TO_READ', 
      total_ratings: book.total_ratings
    }));

    setTopRatedBooks(formattedBooks);
    
    if (isAutoRefresh) {
      console.log("Auto-refresh completed successfully");
    }
    
  } catch (error) {
    console.error('Error in fetchTopRatedBooks:', error);
  }
};

const loadReadingListStatus = async () => {
  try {
    let bookKeys = new Set();
    
    // Get from localStorage
    const localReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    localReadingList.forEach(book => bookKeys.add(book.key));
    
    // If user is logged in, also get from Supabase
    if (user) {
      const { data, error } = await supabase
        .from('reading_list')
        .select('book_key')
        .eq('user_id', user.id);
      
      if (data && !error) {
        data.forEach(item => bookKeys.add(item.book_key));
      }
    }
    
    setReadingListBooks(bookKeys);
  } catch (error) {
    console.error('Error loading reading list status:', error);
  }
};

useEffect(() => {
  const interval = setInterval(() => {
    fetchTopRatedBooks(true); 
    console.log("Auto-refreshed top rated books");
  }, 15000); // Refreshed top rated every 15 secons to prevent aggressive refresh uwu

  return () => {
    clearInterval(interval);
    console.log("Interval cleared");
  };
}, []); 

useEffect(() => {
  const interval = setInterval(() => {
    fetchTopRatedBooks(true);
  }, 15000);

  return () => clearInterval(interval);
}, [user?.id]); 

let cachedRecommendations = null;
let cachedRecommendationBasis = null;

// Replace getSessionRecommendations function
const getSessionRecommendations = () => {
  try {
    const cached = sessionStorage.getItem('currentRecommendations');
    const cachedBasis = sessionStorage.getItem('currentRecommendationBasis');
    
    if (cached && cachedBasis) {
      const recommendations = JSON.parse(cached);
      if (recommendations.length > 0) {
        return {
          recommendations: recommendations,
          basis: cachedBasis
        };
      }
    }
  } catch (error) {
    console.error('Error reading cached recommendations:', error);
  }
  return null;
};

// Replace setSessionRecommendations function
const setSessionRecommendations = (recommendations, basis) => {
  try {
    sessionStorage.setItem('currentRecommendations', JSON.stringify(recommendations));
    sessionStorage.setItem('currentRecommendationBasis', basis);
  } catch (error) {
    console.error('Error caching recommendations:', error);
  }
};

// Replace clearSessionRecommendations function
const clearSessionRecommendations = () => {
  try {
    sessionStorage.removeItem('currentRecommendations');
    sessionStorage.removeItem('currentRecommendationBasis');
  } catch (error) {
    console.error('Error clearing cached recommendations:', error);
  }
};

  // Add variety to recommendation basis message
  const generateRecommendationBasis = (preferences) => {
    const { topSubjects, topAuthors } = preferences;
    
    const basisOptions = [
      `Based on your interest in: ${topSubjects.slice(0, 3).join(', ')}`,
      `Curated for your taste in: ${topSubjects.slice(0, 2).join(' and ')}`,
      `Handpicked based on your love for: ${topSubjects.slice(0, 3).join(', ')}`,
      `Discovered through your reading preferences: ${topSubjects.slice(0, 2).join(' & ')}`
    ];
    
    if (topAuthors.length > 0) {
      basisOptions.push(`Based on your reading history and favorite authors`);
      basisOptions.push(`Tailored to your literary preferences`);
    }
    
    return basisOptions[Math.floor(Math.random() * basisOptions.length)];
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
  
  // Shuffle subjects and authors for variety each session
  const shuffledSubjects = [...topSubjects].sort(() => 0.5 - Math.random());
  const shuffledAuthors = [...topAuthors].sort(() => 0.5 - Math.random());
  
  try {
    // Vary the number of subjects used (3-5 instead of fixed 5)
    const subjectsToUse = Math.min(shuffledSubjects.length, 3 + Math.floor(Math.random() * 3));
    
    // Search based on shuffled subjects
    for (const subject of shuffledSubjects.slice(0, subjectsToUse)) {
      // Vary the sort method for more variety
      const sortMethods = ['rating', 'new', 'old', 'random'];
      const randomSort = sortMethods[Math.floor(Math.random() * sortMethods.length)];
      
      const response = await fetch(
        `https://openlibrary.org/search.json?subject=${encodeURIComponent(subject)}&limit=15&sort=${randomSort}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.docs) {
          const userBookKeys = userReadingList.map(book => book.key);
          const newBooks = data.docs
            .filter(book => !userBookKeys.includes(book.key) && book.cover_i)
            .sort(() => 0.5 - Math.random()) // Shuffle results
            .slice(0, 4 + Math.floor(Math.random() * 3)); // Vary number taken (4-6)
          
          recommendations.push(...newBooks);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Vary author-based recommendations (use 1-3 authors)
    const authorsToUse = Math.min(shuffledAuthors.length, 1 + Math.floor(Math.random() * 3));
    
    for (const author of shuffledAuthors.slice(0, authorsToUse)) {
      const response = await fetch(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=10&sort=rating`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.docs) {
          const userBookKeys = userReadingList.map(book => book.key);
          const newBooks = data.docs
            .filter(book => !userBookKeys.includes(book.key) && book.cover_i)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4 books per author
          
          recommendations.push(...newBooks);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Remove duplicates and shuffle final results
    const uniqueRecommendations = recommendations
      .filter((book, index, self) => 
        index === self.findIndex(b => b.key === book.key)
      )
      .sort(() => 0.5 - Math.random()); // Final shuffle
    
    // If we have less than 20, fill with additional random searches
    if (uniqueRecommendations.length < 40) {
      const additionalBooks = await generateAdditionalBooks(40 - uniqueRecommendations.length, uniqueRecommendations);
      uniqueRecommendations.push(...additionalBooks);
    }
    
    return uniqueRecommendations.slice(0, 40);
    
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return [];
  }
};

  // Generate additional books to reach 20 total
  const generateAdditionalBooks = async (needed, existingBooks) => {
  const additionalQueries = [
    'popular fiction', 'bestseller', 'award winning', 'classic literature',
    'contemporary fiction', 'mystery', 'romance', 'science fiction',
    'fantasy', 'historical fiction', 'thriller', 'literary fiction',
    'biography', 'adventure', 'horror', 'drama', 'comedy', 'memoir'
  ];
  
  // Shuffle queries for variety each session
  const shuffledQueries = [...additionalQueries].sort(() => 0.5 - Math.random());
  
  const additionalBooks = [];
  const existingKeys = existingBooks.map(book => book.key);
  const userBookKeys = userReadingList.map(book => book.key);
  const allExistingKeys = [...existingKeys, ...userBookKeys];
  
  try {
    for (const query of shuffledQueries) {
      if (additionalBooks.length >= needed) break;
      
      // Vary sort method for each query
      const sortMethods = ['rating', 'new', 'old'];
      const randomSort = sortMethods[Math.floor(Math.random() * sortMethods.length)];
      
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&sort=${randomSort}`
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
            .sort(() => 0.5 - Math.random()) // Shuffle results
            .slice(0, Math.min(2 + Math.floor(Math.random() * 2), needed - additionalBooks.length)); // Take 2-3 books
          
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
        .slice(0, 40);
      
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
        
        // Set recommendation basis message with variety
        if (preferences.topSubjects.length > 0) {
          basis = generateRecommendationBasis(preferences);
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
      if (recommendations.length < 40 && readingList.length === 0) {
        const additional = await generateRandomRecommendations();
        recommendations = [...recommendations, ...additional]
          .filter((book, index, self) => 
            index === self.findIndex(b => b.key === book.key)
          )
          .slice(0, 40);
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
      // Check for cached recommendations first
      const cached = getSessionRecommendations();
      if (cached && cached.recommendations.length > 0) {
        // Load from cache
        setRecommendedBooks(cached.recommendations);
        setRecommendationBasis(cached.basis);
        setRecommendationsLoading(false);
        console.log('Loaded cached recommendations');

        await loadReadingListStatus();
      } else {
        // Generate new recommendations
        await loadRecommendations();
      }
      
      await fetchTopRatedBooks();
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user]);

// Clear cache when navigating to other pages (except book description)
useEffect(() => {
  const handleBeforeUnload = () => {
    // This will clear cache when the page is refreshed or closed
    clearSessionRecommendations();
  };

  const handlePopState = () => {
    // Check if we're navigating away from homepage
    if (window.location.pathname !== '/') {
      clearSessionRecommendations();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
  };
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

  // Handle book card click
  const handleRecommendationClick = (book) => {
    localStorage.setItem('selectedBook', JSON.stringify(book));
    navigate('/Book', { state: { preserveRecommendations: true } });
  };

  const handleTopRatedBookClick = (book) => {
  const bookData = {
    key: book.id,
    title: book.title,
    author_name: [book.author], 
    cover_i: book.coverID, 
    publish_year:  book.publish_year,
    subject: book.subjects,
    rating: book.score,
    total_ratings: book.total_ratings,
    rank: book.rank
  };
  
  localStorage.setItem('selectedBook', JSON.stringify(bookData));
  navigate('/Book');
};


const handleAddToReadingList = async (e, book, index) => {
  e.stopPropagation();
  
  // Check if this is a top-rated book (has rank and score properties)
  const isTopRatedBook = book.hasOwnProperty('rank') && book.hasOwnProperty('score');
  
  let title, author, bookKey, coverId, publishYear, subjects;
  
  if (isTopRatedBook) {
    // Handle top-rated books structure
    title = book.title?.trim() || "No title available";
    author = book.author || "Unknown author";
    bookKey = book.id;
    coverId = book.coverID;
    publishYear = book.publish_year || null;
    subjects = book.subjects || null;
  } else {
    // Handle regular Open Library books structure
    title = book.title?.trim() || "No title available";
    author = Array.isArray(book.author_name) && book.author_name.length > 0
      ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
      : "Unknown author";
    bookKey = book.key;
    coverId = book.cover_i;
    publishYear = book.first_publish_year;
    subjects = book.subject ? book.subject.slice(0, 5).join(", ") : null;
  }

  // Check if book is already in reading list
  const isInReadingList = readingListBooks.has(bookKey);
  
  if (isInReadingList) {
    // If book is already in reading list, redirect to Reading List page
    window.open('/ReadingList', '_blank');
    return;
  } else {
    // Add to reading list
    let readingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    
    const bookToAdd = {
      title: title,
      author: author,
      key: bookKey,
      cover_id: coverId,
      publish_year: publishYear,
      subject: subjects
    };
    
    readingList.push(bookToAdd);
    localStorage.setItem('readingList', JSON.stringify(readingList));
    
    // Update state
    setReadingListBooks(prev => new Set([...prev, bookKey]));

    // Insert to Supabase if user is logged in
    if (user) {
      try {
        const toBeRead = "TO_BE_READ";
        const bookData = {
          user_id: user.id,
          book_key: bookKey,
          title: title,
          author: author,
          cover_id: coverId,
          publish_year: publishYear,
          isbn: isTopRatedBook ? null : (book.isbn ? book.isbn[0] : null),
          subject: subjects,
          added_at: new Date().toISOString(),
          status: toBeRead
        };
        
        await insertReadingList(bookData, book, user.id);
      } catch (error) {
        console.error('Error adding to Supabase:', error);
        // Revert state if error
        setReadingListBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookKey);
          return newSet;
        });
      }
    }
  }
};

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

  // Helper function to truncate text
  const truncateText = (text, maxLength = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const BookCard = ({ book }) => {
  const coverId = book.coverID?.toString().trim() ? book.coverID : null;
  
  // Click handler for the entire card
  const handleCardClick = () => {
    handleTopRatedBookClick(book);
  };

  return (
    <div className="hp-book-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="book-rank">
        <span className="rank-number">{book.rank}</span>
      </div>
      
      <div className="hp-book-info">
        <div className="book-cover-small">
          {book.coverID ? (
            <img 
              src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
              alt={`Cover of ${book.title}`} 
              className="top-rated-cover-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="cover-placeholder-small" style={{ display: book.coverID ? 'none' : 'flex' }}>
            <span>📚</span>
          </div>
        </div>
        
        <div className="book-text-info">
          <h3 className="hp-book-title">{book.title}</h3>
          <p className="hp-book-author">{book.author}</p>
          <p className="hp-book-users">{book.users}</p>
        </div>
      </div>
      
      <div className="hp-book-score">
        <div className="hp-score-number">{book.score}</div>
        <div className="hp-book-users">Rating</div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ book, readingListBooks }) => {
  const title = book.title?.trim() || "No title available";
  const author = Array.isArray(book.author_name) && book.author_name.length > 0
    ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
    : "Unknown author";
  const coverId = book.cover_i?.toString().trim() ? book.cover_i : null;
  
  const isInReadingList = readingListBooks.has(book.key);

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
          className={`add-to-list-btn-small ${isInReadingList ? 'in-reading-list' : ''}`}
          onClick={(e) => handleAddToReadingList(e, book)}
        >
          {isInReadingList ? 'In Reading List' : 'Add to List'}
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

  const tableHeader = (
  <div className="table-header">
    <div className="header-rank">RANKING</div>
    <div className="header-title-col">TITLE</div>
    <div className="header-score">SCORE</div>
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
      

      {/* Recommendations Section */}
      <div className="recommendations-section">
        <div className="container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
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
                  [...Array(40)].map((_, index) => (
                    <RecommendationSkeleton key={index} />
                  ))
                ) : (
                recommendedBooks.map(book => (
                      <RecommendationCard 
                        key={book.key} 
                        book={book} 
                        readingListBooks={readingListBooks}
                      />
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
              <h2 className="hp-header-title">
                Top Rated Books
                {topRatedBooks.length > 0 && (
                  <span className="books-count"> ({topRatedBooks.length} books)</span>
                )}
              </h2>
            </div>
            
            {/* Table Header */}
            <div className="table-header">
              <div className="header-rank">RANKING</div>
              <div className="header-title-col">TITLE</div>
              <div className="header-user-score">SCORE</div>  
            </div>
            
            {/* Top Rated Books List */}
            <div className="top-rated-list">
              {topRatedBooks.length > 0 ? (
                topRatedBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))
              ) : (
                <div className="no-books-message">
                  <p>No rated books found. Be the first to rate some books!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with additional actions */}
      <div className="footer-actions">
        <div className="container">
          <div className="action-buttons">
            <button 
              className="action-button primary"
              onClick={() => navigate('/Discover')}
            >
              Discover More Books
            </button>
            <button 
              className="action-button secondary"
              onClick={() => window.open('/ReadingList', '_blank')}
            >
              View Reading List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
