import React, { useState, useEffect } from 'react';
import Stack from '../components/Stack';
import { UserAuth } from '../context/AuthContext';
import './Discover.css';

const DiscoverPage = () => {
  const [books, setBooks] = useState([]);
  const [bookQueue, setBookQueue] = useState([]);
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [savedBooks, setSavedBooks] = useState([]);
  const [swipedBooks, setSwipedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userReadingList, setUserReadingList] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const maintainBookQueue = (newBooks = []) => {
    setBookQueue(prevQueue => {
      // Create a Set of existing book IDs for faster lookup
      const existingIds = new Set(prevQueue.map(book => book.id));
      
      // Filter out duplicates and already seen books
      const uniqueNewBooks = newBooks.filter(book => 
        !existingIds.has(book.id) &&
        !swipedBooks.includes(book.id) && 
        !savedBooks.some(saved => saved.id === book.id)
      );
      
      const combined = [...prevQueue, ...uniqueNewBooks];
      const filtered = combined.filter(book => 
        !swipedBooks.includes(book.id) && 
        !savedBooks.some(saved => saved.id === book.id)
      );
      
      // Update displayed books to always show 10
      const newDisplayed = filtered.slice(0, 10);
      setDisplayedBooks(newDisplayed);
      
      return filtered;
    });
  };

  // Load user's reading list from localStorage - FIXED: Only run once
  useEffect(() => {
    const storedReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    setUserReadingList(storedReadingList);
    setIsInitialized(true);
  }, []);

  // FIXED: Initialize component after reading list is loaded
  useEffect(() => {
    if (!isInitialized) return;

    const sessionData = getSessionData();
    
    // Set saved and swiped books first
    setSavedBooks(sessionData.savedBooks);
    setSwipedBooks(sessionData.swipedBooks);

    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const hasRecentData = sessionData.lastFetchTime &&
      parseInt(sessionData.lastFetchTime) > thirtyMinutesAgo;

    if (hasRecentData && sessionData.currentBooks.length > 0) {
      // Filter out books that were already swiped or saved
      const availableBooks = sessionData.currentBooks.filter(book => 
        !sessionData.swipedBooks.includes(book.id) && 
        !sessionData.savedBooks.some(saved => saved.id === book.id)
      );
      
      if (availableBooks.length > 0) {
        setBooks(availableBooks);
        setBookQueue(availableBooks);
        setDisplayedBooks(availableBooks.slice(0, 10));
        setIsLoading(false);
        console.log('Loaded cached discover books from session');
        return;
      }
    }
    
    // If no valid cached data, fetch new books
    fetchRecommendedBooks();
  }, [isInitialized]);

  // FIXED: Fetch recommended books with better error handling and API calls
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
          // Filter out books that were already swiped or saved
          const availableBooks = sessionData.currentBooks.filter(book => 
            !swipedBooks.includes(book.id) && 
            !savedBooks.some(saved => saved.id === book.id)
          );
          
          if (availableBooks.length > 0) {
            setBooks(availableBooks);
            setBookQueue(availableBooks);
            setDisplayedBooks(availableBooks.slice(0, 10));
            setIsLoading(false);
            console.log('Using cached discover books from session');
            return;
          }
        }
      }

      let recommendedBooks = [];
      const userGenres = getUserGenres(userReadingList);
      
      if (userGenres.length > 0) {
        // FIXED: Better API queries with proper error handling
        const genreQueries = userGenres.slice(0, 3).map(genre => 
          `subject:"${genre}" AND has_fulltext:true`
        );
        
        // Process queries sequentially to avoid rate limiting
        for (const query of genreQueries) {
          try {
            const response = await fetch(
              `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&sort=rating&fields=key,title,author_name,cover_i,subject,first_publish_year,ratings_average`,
              {
                headers: {
                  'User-Agent': 'BookDiscoveryApp/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.docs && Array.isArray(data.docs)) {
                recommendedBooks.push(...data.docs);
              }
            } else {
              console.warn(`API request failed with status: ${response.status}`);
            }
            
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (fetchError) {
            console.warn('Individual fetch error:', fetchError);
          }
        }
      } else {
        // FIXED: Fallback queries for users without reading history
        const popularQueries = [
          'subject:"fiction" AND ratings_count:>50',
          'subject:"romance" AND ratings_count:>30',
          'subject:"fantasy" AND ratings_count:>30'
        ];
        
        for (const query of popularQueries) {
          try {
            const response = await fetch(
              `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&sort=rating&fields=key,title,author_name,cover_i,subject,first_publish_year`,
              {
                headers: {
                  'User-Agent': 'BookDiscoveryApp/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.docs && Array.isArray(data.docs)) {
                recommendedBooks.push(...data.docs);
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (fetchError) {
            console.warn('Popular books fetch error:', fetchError);
          }
        }
      }
      
      // FIXED: Better filtering and validation with global deduplication
      const seenBooks = new Set();
      const filteredBooks = recommendedBooks
        .filter((book) => {
          // Basic validation
          const hasRequiredFields = book.key && book.title && book.author_name;
          const hasValidAuthor = Array.isArray(book.author_name) && book.author_name.length > 0;
          const notInReadingList = !userReadingList.some(readingBook => readingBook.key === book.key);
          
          // Check for duplicates using book key
          const isDuplicate = seenBooks.has(book.key);
          if (!isDuplicate) {
            seenBooks.add(book.key);
          }
          
          return !isDuplicate && hasRequiredFields && hasValidAuthor && notInReadingList;
        })
        .slice(0, 20) // Limit to 20 books
        .map(book => ({
          id: book.key, // Use book.key as the unique identifier
          title: book.title?.trim() || "No title available",
          author: Array.isArray(book.author_name) && book.author_name.length > 0
            ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
            : "Unknown author",
          genres: book.subject && Array.isArray(book.subject)
            ? book.subject.slice(0, 3).join(", ") 
            : "General",
          coverUrl: book.cover_i 
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
          // Store original book data for saving
          originalBook: book
        }));
      
      if (filteredBooks.length === 0) {
        throw new Error('No books found matching your preferences');
      }
      
      // Cache the fetched books and timestamp
      setSessionData(SESSION_KEYS.CURRENT_BOOKS, filteredBooks);
      setSessionData(SESSION_KEYS.LAST_FETCH_TIME, Date.now().toString());
      
      // Merge with existing books, avoiding duplicates
      setBooks(prevBooks => {
        const existingIds = new Set(prevBooks.map(book => book.id));
        const uniqueNewBooks = filteredBooks.filter(book => !existingIds.has(book.id));
        const combined = [...prevBooks, ...uniqueNewBooks];
        
        // Filter out swiped and saved books
        const available = combined.filter(book => 
          !swipedBooks.includes(book.id) && 
          !savedBooks.some(saved => saved.id === book.id)
        );
        
        return available;
      });
      
      // Update queue with new books
      setBookQueue(prevQueue => {
        const existingIds = new Set(prevQueue.map(book => book.id));
        const uniqueNewBooks = filteredBooks.filter(book => 
          !existingIds.has(book.id) &&
          !swipedBooks.includes(book.id) && 
          !savedBooks.some(saved => saved.id === book.id)
        );
        const combined = [...prevQueue, ...uniqueNewBooks];
        
        // Update displayed books
        const newDisplayed = combined.slice(0, 10);
        setDisplayedBooks(newDisplayed);
        
        return combined;
      });
      
      console.log(`Fetched and cached ${filteredBooks.length} new discover books`);
      
    } catch (error) {
      console.error('Error fetching recommended books:', error);
      setError('Failed to load recommended books. Please try again.');
      
      // FIXED: Better fallback with more diverse mock data
      const mockBooks = [
        {
          id: 'mock-1',
          title: "The Midnight Library",
          author: "Matt Haig",
          genres: "Fiction, Philosophy, Contemporary",
          coverUrl: null,
          originalBook: {
            key: 'mock-1',
            title: "The Midnight Library",
            author_name: ["Matt Haig"],
            subject: ["Fiction", "Philosophy", "Contemporary"],
            cover_i: null,
            first_publish_year: 2020
          }
        },
        {
          id: 'mock-2',
          title: "Atomic Habits",
          author: "James Clear",
          genres: "Self-help, Psychology, Productivity",
          coverUrl: null,
          originalBook: {
            key: 'mock-2',
            title: "Atomic Habits",
            author_name: ["James Clear"],
            subject: ["Self-help", "Psychology", "Productivity"],
            cover_i: null,
            first_publish_year: 2018
          }
        },
        {
          id: 'mock-3',
          title: "The Seven Husbands of Evelyn Hugo",
          author: "Taylor Jenkins Reid",
          genres: "Fiction, Romance, Historical Fiction",
          coverUrl: null,
          originalBook: {
            key: 'mock-3',
            title: "The Seven Husbands of Evelyn Hugo",
            author_name: ["Taylor Jenkins Reid"],
            subject: ["Fiction", "Romance", "Historical Fiction"],
            cover_i: null,
            first_publish_year: 2017
          }
        }
      ];
      
      setSessionData(SESSION_KEYS.CURRENT_BOOKS, mockBooks);
      setSessionData(SESSION_KEYS.LAST_FETCH_TIME, Date.now().toString());
      
      setBooks(mockBooks);
      setBookQueue(mockBooks);
      setDisplayedBooks(mockBooks.slice(0, 10));
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Improved swipe handlers with better state management
  const handleSwipeLeft = (book) => {
    console.log(`Skipping: ${book.title}`);
    
    const newSwipedBooks = [...swipedBooks, book.id];
    setSwipedBooks(newSwipedBooks);
    setSessionData(SESSION_KEYS.SWIPED_BOOKS, newSwipedBooks);
    
    // Remove from queue and maintain 10 cards
    setBookQueue(prevQueue => {
      const remaining = prevQueue.filter(b => b.id !== book.id);
      const newDisplayed = remaining.slice(0, 10);
      setDisplayedBooks(newDisplayed);
      
      // Fetch more if queue is getting low
      if (remaining.length < 5 && !isLoading) {
        fetchRecommendedBooks();
      }
      
      return remaining;
    });
  };

  const handleSwipeRight = async (book) => {
    console.log(`Saving: ${book.title}`);
    
    try {
      const newSavedBooks = [...savedBooks, book];
      const newSwipedBooks = [...swipedBooks, book.id];
      
      setSavedBooks(newSavedBooks);
      setSwipedBooks(newSwipedBooks);
      setSessionData(SESSION_KEYS.SAVED_BOOKS, newSavedBooks);
      setSessionData(SESSION_KEYS.SWIPED_BOOKS, newSwipedBooks);
      
      await handleAddToReadingList(book);
      
      // Same queue management as swipe left
      setBookQueue(prevQueue => {
        const remaining = prevQueue.filter(b => b.id !== book.id);
        const newDisplayed = remaining.slice(0, 10);
        setDisplayedBooks(newDisplayed);
        
        if (remaining.length < 5 && !isLoading) {
          fetchRecommendedBooks();
        }
        
        return remaining;
      });
      
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  // FIXED: Better error handling in add to reading list
  const handleAddToReadingList = async (book) => {
    try {
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
        subject: originalBook.subject && Array.isArray(originalBook.subject) 
          ? originalBook.subject.slice(0, 5).join(", ") 
          : null
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
            isbn: originalBook.isbn && Array.isArray(originalBook.isbn) ? originalBook.isbn[0] : null,
            subject: originalBook.subject && Array.isArray(originalBook.subject) 
              ? originalBook.subject.slice(0, 5).join(", ") 
              : null,
            added_at: new Date().toISOString(),
            status: toBeRead
          };
          
          await insertReadingList(bookData, originalBook, user.id);
          
        } catch (error) {
          console.error('Error inserting to Supabase:', error);
          // Don't throw here, as local storage save was successful
        }
      }
    } catch (error) {
      console.error('Error in handleAddToReadingList:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Force refresh function
  const handleRefreshBooks = () => {
    clearSessionData();
    setSavedBooks([]);
    setSwipedBooks([]);
    setBooks([]);
    setDisplayedBooks([]);
    fetchRecommendedBooks(true);
  };

  // Loading component
  if (isLoading && books.length === 0) {
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
  if (displayedBooks.length === 0 && !isLoading) {
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
          {savedBooks.length} saved • {swipedBooks.length} skipped
        </p>
      </div>
      
      <div className="book-card-container">
        <Stack
          cardsData={displayedBooks}
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