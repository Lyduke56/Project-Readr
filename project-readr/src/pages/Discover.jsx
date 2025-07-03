import React, { useState, useEffect } from 'react';
import Stack from '../components/Stack';
import { UserAuth } from '../context/AuthContext';
import './Discover.css';

const DiscoverPage = () => {
  const [books, setBooks] = useState([]);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [savedBooks, setSavedBooks] = useState([]);
  const [swipedBooks, setSwipedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userReadingList, setUserReadingList] = useState([]);

  const { session, insertReadingList } = UserAuth();
  const user = session?.user;

  // Session storage keys
  const SESSION_KEYS = {
    SWIPED_BOOKS: 'discover_swiped_books',
    SAVED_BOOKS: 'discover_saved_books',
    CURRENT_BOOKS: 'discover_current_books',
    LAST_FETCH_TIME: 'discover_last_fetch_time'
  };

  // Check if session data exists for discover page
  const getSessionData = () => {
    try {
      const swipedBooks = JSON.parse(sessionStorage.getItem(SESSION_KEYS.SWIPED_BOOKS) || '[]');
      const savedBooks = JSON.parse(sessionStorage.getItem(SESSION_KEYS.SAVED_BOOKS) || '[]');
      const currentBooks = JSON.parse(sessionStorage.getItem(SESSION_KEYS.CURRENT_BOOKS) || '[]');
      const lastFetchTime = sessionStorage.getItem(SESSION_KEYS.LAST_FETCH_TIME);
      
      return {
        swipedBooks,
        savedBooks,
        currentBooks,
        lastFetchTime
      };
    } catch (error) {
      console.error('Error reading session data:', error);
      return {
        swipedBooks: [],
        savedBooks: [],
        currentBooks: [],
        lastFetchTime: null
      };
    }
  };

  // Cache session data
  const setSessionData = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching session data:', error);
    }
  };

  // Clear session data
  const clearSessionData = () => {
    try {
      Object.values(SESSION_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
      console.log('Discover session data cleared');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  };

  // Extract genres from user's reading list for recommendations
  const getUserGenres = (readingList) => {
    const genres = new Set();
    readingList.forEach(book => {
      if (book.subject) {
        // Split subjects and add to genres set
        book.subject.split(',').forEach(genre => {
          genres.add(genre.trim().toLowerCase());
        });
      }
    });
    return Array.from(genres);
  };

  // Load user's reading list from localStorage
  useEffect(() => {
    const storedReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    setUserReadingList(storedReadingList);
  }, []);

  // Load session data on component mount
useEffect(() => {
  const storedReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
  setUserReadingList(storedReadingList);
}, []); // <- only on mount

useEffect(() => {
  if (userReadingList.length >= 0) {
    const sessionData = getSessionData();

    setSavedBooks(sessionData.savedBooks);
    setSwipedBooks(sessionData.swipedBooks);

    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const hasRecentData = sessionData.lastFetchTime &&
      parseInt(sessionData.lastFetchTime) > thirtyMinutesAgo;

    if (hasRecentData && sessionData.currentBooks.length > 0) {
      setBooks(sessionData.currentBooks);
      setIsLoading(false);
      console.log('Loaded cached discover books from session');
    } else {
      fetchRecommendedBooks();
    }
  }
}, []); // <- only on mount, or you can add a flag if needed

  // Fetch recommended books based on user's reading list
  const fetchRecommendedBooks = async (forceRefresh = false) => {
    setIsLoading(true);
    setError('');
    
    try {
      // If not forcing refresh, check session cache first
      if (!forceRefresh) {
        const sessionData = getSessionData();
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        const hasRecentData = sessionData.lastFetchTime && 
                             parseInt(sessionData.lastFetchTime) > thirtyMinutesAgo;
        
        if (hasRecentData && sessionData.currentBooks.length > 0) {
          setBooks(sessionData.currentBooks);
          setIsLoading(false);
          console.log('Using cached discover books from session');
          return;
        }
      }

      let recommendedBooks = [];
      const userGenres = getUserGenres(userReadingList);
      
      if (userGenres.length > 0) {
        // Fetch books based on user's preferred genres
        const genreQueries = userGenres.slice(0, 3).map(genre => 
          `subject:${encodeURIComponent(genre)}`
        );
        
        for (const query of genreQueries) {
          const response = await fetch(
            `https://openlibrary.org/search.json?q=${query}&limit=10&sort=rating`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.docs) {
              recommendedBooks.push(...data.docs);
            }
          }
        }
      } else {
        // If no reading list, fetch popular books from various genres
        const popularQueries = [
          'subject:fiction popular',
          'subject:romance bestseller',
          'subject:fantasy trending',
          'subject:mystery thriller',
          'subject:science_fiction',
          'subject:biography',
          'subject:history',
          'subject:self_help'
        ];
        
        for (const query of popularQueries) {
          const response = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&sort=rating`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.docs) {
              recommendedBooks.push(...data.docs);
            }
          }
        }
      }
      
      // Filter and format books
      const filteredBooks = recommendedBooks
        .filter((book, index, self) => 
          // Remove duplicates and filter books with covers
          index === self.findIndex(b => b.key === book.key) && 
          book.cover_i && 
          book.title && 
          book.author_name &&
          // Exclude books already in user's reading list
          !userReadingList.some(readingBook => readingBook.key === book.key)
        )
        .slice(0, 20) // Limit to 20 books
        .map(book => ({
          id: book.key,
          title: book.title?.trim() || "No title available",
          author: Array.isArray(book.author_name) && book.author_name.length > 0
            ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
            : "Unknown author",
          genres: book.subject 
            ? book.subject.slice(0, 3).join(", ") 
            : "General",
          coverUrl: book.cover_i 
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
          // Store original book data for saving
          originalBook: book
        }));
      
      // Cache the fetched books and timestamp
      setSessionData(SESSION_KEYS.CURRENT_BOOKS, filteredBooks);
      setSessionData(SESSION_KEYS.LAST_FETCH_TIME, Date.now().toString());
      
      setBooks(filteredBooks);
      console.log('Fetched and cached new discover books');
      
    } catch (error) {
      console.error('Error fetching recommended books:', error);
      setError('Failed to load recommended books. Please try again.');
      
      // Fallback to mock data if API fails
      const mockBooks = [
        {
          id: 'mock-1',
          title: "I Have No Mouth & I Must Scream",
          author: "Ellison, Harlan",
          genres: "Science Fiction, Speculative Fiction, Horror",
          coverUrl: "/485894.png",
          originalBook: {
            key: 'mock-1',
            title: "I Have No Mouth & I Must Scream",
            author_name: ["Ellison, Harlan"],
            subject: ["Science Fiction", "Speculative Fiction", "Horror"],
            cover_i: null,
            first_publish_year: 1967
          }
        },
        {
          id: 'mock-2',
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          genres: "Fiction, Southern Gothic, Bildungsroman",
          coverUrl: "/960px-To_Kill_a_Mockingbird_(first_edition_cover).png",
          originalBook: {
            key: 'mock-2',
            title: "To Kill a Mockingbird",
            author_name: ["Harper Lee"],
            subject: ["Fiction", "Southern Gothic", "Bildungsroman"],
            cover_i: null,
            first_publish_year: 1960
          }
        },
        {
          id: 'mock-3',
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          genres: "Tragedy, Jazz Age",
          coverUrl: "/The_Great_Gatsby_Cover_1925_Retouched.png",
          originalBook: {
            key: 'mock-3',
            title: "The Great Gatsby",
            author_name: ["F. Scott Fitzgerald"],
            subject: ["Tragedy", "Jazz Age"],
            cover_i: null,
            first_publish_year: 1925
          }
        }
      ];
      
      // Cache mock books as well
      setSessionData(SESSION_KEYS.CURRENT_BOOKS, mockBooks);
      setSessionData(SESSION_KEYS.LAST_FETCH_TIME, Date.now().toString());
      
      setBooks(mockBooks);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle swipe left (skip book)
  const handleSwipeLeft = (book) => {
    console.log(`Skipping: ${book.title}`);
    
    const newSwipedBooks = [...swipedBooks, book.id];
    setSwipedBooks(newSwipedBooks);
    
    // Update session storage
    setSessionData(SESSION_KEYS.SWIPED_BOOKS, newSwipedBooks);
    
    // Load more books if running low
    if (visibleBooks.length <= 3) {
      fetchRecommendedBooks();
    }
  };

  // Handle swipe right (save to reading list)
  const handleSwipeRight = async (book) => {
    console.log(`Saving: ${book.title}`);
    
    try {
      const newSavedBooks = [...savedBooks, book];
      const newSwipedBooks = [...swipedBooks, book.id];
      
      // Update local state
      setSavedBooks(newSavedBooks);
      setSwipedBooks(newSwipedBooks);
      
      // Update session storage
      setSessionData(SESSION_KEYS.SAVED_BOOKS, newSavedBooks);
      setSessionData(SESSION_KEYS.SWIPED_BOOKS, newSwipedBooks);
      
      // Handle add to reading list
      await handleAddToReadingList(book);
      
      // Load more books if running low
      const updatedVisibleBooks = books.filter(b => ![...swipedBooks, book.id].includes(b.id));
      if (updatedVisibleBooks.length === 0) {
        fetchRecommendedBooks();
      }

      
    } catch (error) {
      console.error('Error saving book:', error);
      // Still mark as swiped even if save fails
      const newSwipedBooks = [...swipedBooks, book.id];
      setSwipedBooks(newSwipedBooks);
      setSessionData(SESSION_KEYS.SWIPED_BOOKS, newSwipedBooks);
    }
  };

  // Add book to reading list (adapted from Home component)
  const handleAddToReadingList = async (book) => {
    const originalBook = book.originalBook;
    const title = book.title;
    const author = book.author;

    // Get existing reading list
    let readingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    const bookToAdd = {
      title: title,
      author: author,
      key: originalBook.key,
      cover_id: originalBook.cover_i,
      publish_year: originalBook.first_publish_year,
      subject: originalBook.subject ? originalBook.subject.slice(0, 5).join(", ") : null
    };
    
    // Check if book is already in reading list
    const exists = readingList.some(item => item.key === originalBook.key);
    if (!exists) {
      readingList.push(bookToAdd);
      localStorage.setItem('readingList', JSON.stringify(readingList));
      
      // Update local state
      setUserReadingList(readingList);
      
      console.log('Added to reading list:', title);
    }

    // Insert to Supabase if user is logged in
    if (user) {
      try {
        const toBeRead = "TO_BE_READ";
        
        const bookData = {
          user_id: user.id,
          book_key: originalBook.key,
          title: title,
          author: author,
          cover_id: originalBook.cover_i,
          publish_year: originalBook.first_publish_year,
          isbn: originalBook.isbn ? originalBook.isbn[0] : null,
          subject: originalBook.subject ? originalBook.subject.slice(0, 5).join(", ") : null,
          added_at: new Date().toISOString(),
          status: toBeRead
        };
        
        await insertReadingList(bookData, originalBook, user.id);
        
      } catch (error) {
        console.error('Error inserting to Supabase:', error);
      }
    }
  };

  // Force refresh function (similar to Homepage)
  const handleRefreshBooks = () => {
    clearSessionData();
    fetchRecommendedBooks(true);
  };

  // Get visible books (not swiped)
  const visibleBooks = books.filter(book => !swipedBooks.includes(book.id));

  // Loading component
  if (isLoading) {
    return (
      <div className="discover-container">
        <h1 className="discover-title">Discover Books</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading personalized recommendations...</p>
        </div>
      </div>
    );
  }

  // Error component
  if (error && books.length === 0) {
    return (
      <div className="discover-container">
        <h1 className="discover-title">Discover Books</h1>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => fetchRecommendedBooks(true)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No more books component
  if (visibleBooks.length === 0) {
    return (
      <div className="discover-container">
        <h1 className="discover-title">Discover Books</h1>
        <div className="no-books-container">
          <h2>No more books to discover!</h2>
          <p>You've seen all our current recommendations.</p>
          <button 
            className="refresh-button"
            onClick={handleRefreshBooks}
          >
            Get New Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-container">
      <h1 className="discover-title">Discover Books</h1>
      
      {/* Progress indicator */}
      <div className="progress-container">
        <p className="progress-text">
          {savedBooks.length} saved • {swipedBooks.length} reviewed
        </p>
      </div>
      
      <div className="book-card-container">
        <Stack
          cardsData={visibleBooks}
          cardDimensions={{ width: 300, height: 450 }}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          sensitivity={150}
        />
      </div>
      
      <div className="swipe-instructions">
        <div className="swipe-instruction">
          <span className="swipe-direction left">👈</span>
          <span>Skip</span>
        </div>
        <div className="swipe-instruction">
          <span className="swipe-direction right">👉</span>
          <span>Save to Reading List</span>
        </div>
      </div>
      
      {/* Refresh button */}
      <div className="refresh-container">
        <button 
          className="refresh-books-button"
          onClick={handleRefreshBooks}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get New Books'}
        </button>
      </div>
    </div>
  );
};

export default DiscoverPage;