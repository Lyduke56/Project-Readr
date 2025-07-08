import React, { useState, useEffect, useRef } from 'react';
import Stack from '../components/Stack';
import { UserAuth } from '../context/AuthContext';
import './Discover.css';

const DiscoverPage = () => {
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [bookCache, setBookCache] = useState([]); // Books we've fetched but haven't shown yet
  const [savedBooks, setSavedBooks] = useState([]);
  const [swipedBooks, setSwipedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userReadingList, setUserReadingList] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Keep track of books we've already shown to avoid duplicates
  const seenBookIds = useRef(new Set());
  const fetchOffset = useRef(0);

  const { session, insertReadingList } = UserAuth();
  const user = session?.user;

  // Keys for storing data in session storage
  const SESSION_KEYS = {
    SWIPED_BOOKS: 'discover_swiped_books',
    SAVED_BOOKS: 'discover_saved_books',
    DISPLAYED_BOOKS: 'discover_displayed_books',
    BOOK_CACHE: 'discover_book_cache',
    SEEN_BOOK_IDS: 'discover_seen_book_ids',
    FETCH_OFFSET: 'discover_fetch_offset',
    LAST_FETCH_TIME: 'discover_last_fetch_time'
  };

  // Get saved data from session storage
  const getSessionData = () => {
    try {
      const swipedBooks = JSON.parse(sessionStorage.getItem(SESSION_KEYS.SWIPED_BOOKS) || '[]');
      const savedBooks = JSON.parse(sessionStorage.getItem(SESSION_KEYS.SAVED_BOOKS) || '[]');
      const displayedBooks = JSON.parse(sessionStorage.getItem(SESSION_KEYS.DISPLAYED_BOOKS) || '[]');
      const bookCache = JSON.parse(sessionStorage.getItem(SESSION_KEYS.BOOK_CACHE) || '[]');
      const seenIds = JSON.parse(sessionStorage.getItem(SESSION_KEYS.SEEN_BOOK_IDS) || '[]');
      const fetchOffsetValue = parseInt(sessionStorage.getItem(SESSION_KEYS.FETCH_OFFSET) || '0');
      const lastFetchTime = sessionStorage.getItem(SESSION_KEYS.LAST_FETCH_TIME);
      
      return {
        swipedBooks,
        savedBooks,
        displayedBooks,
        bookCache,
        seenIds,
        fetchOffsetValue,
        lastFetchTime
      };
    } catch (error) {
      console.error('Error reading session data:', error);
      return {
        swipedBooks: [],
        savedBooks: [],
        displayedBooks: [],
        bookCache: [],
        seenIds: [],
        fetchOffsetValue: 0,
        lastFetchTime: null
      };
    }
  };

  const setSessionData = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching session data:', error);
    }
  };

  const clearSessionData = () => {
    try {
      Object.values(SESSION_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
      seenBookIds.current.clear();
      fetchOffset.current = 0;
      console.log('Discover session data cleared');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  };

  // Randomly shuffle an array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get genres from the user's reading list for personalized recommendations
  const getUserGenres = (readingList) => {
    const genres = new Set();
    readingList.forEach(book => {
      if (book.subject) {
        book.subject.split(',').forEach(genre => {
          genres.add(genre.trim().toLowerCase());
        });
      }
    });
    return Array.from(genres);
  };

  // Get book keys from reading list to check for duplicates
  const getReadingListKeys = () => {
    return new Set(userReadingList.map(book => book.key));
  };

  // Check if we've already shown this book to the user
  const isDuplicateBook = (book) => {
    const readingListKeys = getReadingListKeys();
    return seenBookIds.current.has(book.key) || 
           readingListKeys.has(book.key) ||
           swipedBooks.includes(book.key) ||
           savedBooks.some(saved => saved.id === book.key);
  };

  // Clean up and format books from the API
  const processBooks = (rawBooks) => {
    const processed = rawBooks
      .filter(book => {
        const hasRequiredFields = book.key && book.title && book.author_name;
        const hasValidAuthor = Array.isArray(book.author_name) && book.author_name.length > 0;
        const isNotDuplicate = !isDuplicateBook(book);
        
        return hasRequiredFields && hasValidAuthor && isNotDuplicate;
      })
      .map(book => ({
        id: book.key,
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
        originalBook: book
      }));

    // Remember these books so we don't show them again
    processed.forEach(book => {
      seenBookIds.current.add(book.id);
    });

    return shuffleArray(processed);
  };

  // Fetch books from the Open Library API
  const fetchBooksFromAPI = async (limit = 50) => {
    setIsFetching(true);
    const userGenres = getUserGenres(userReadingList);
    const queries = [];

    if (userGenres.length > 0) {
      // Use the user's favorite genres for better recommendations
      const selectedGenres = shuffleArray(userGenres).slice(0, 3);
      queries.push(...selectedGenres.map(genre => 
        `subject:"${genre}" AND has_fulltext:true`
      ));
    } else {
      // Default to popular book categories
      const popularCategories = [
        'fiction', 'romance', 'mystery', 'fantasy', 'science fiction',
        'biography', 'history', 'self-help', 'thriller', 'adventure'
      ];
      const selectedCategories = shuffleArray(popularCategories).slice(0, 3);
      queries.push(...selectedCategories.map(category => 
        `subject:"${category}" AND ratings_count:>10`
      ));
    }

    // Add some general discovery queries for variety
    const randomQueries = [
      'publish_year:>2000 AND ratings_count:>20',
      'publish_year:>2010 AND has_fulltext:true',
      'ratings_average:>4.0 AND ratings_count:>50'
    ];
    queries.push(...shuffleArray(randomQueries).slice(0, 2));

    let allBooks = [];
    const booksPerQuery = Math.ceil(limit / queries.length);

    for (const query of queries) {
      try {
        const currentOffset = fetchOffset.current;
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${booksPerQuery}&offset=${currentOffset}&sort=random&fields=key,title,author_name,cover_i,subject,first_publish_year,ratings_average,ratings_count`,
          {
            headers: { 'User-Agent': 'BookDiscoveryApp/1.0' }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.docs && Array.isArray(data.docs)) {
            allBooks.push(...data.docs);
          }
        }

        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.warn('Fetch error for query:', query, error);
      }
    }

    // Update offset for next batch
    fetchOffset.current += booksPerQuery;
    sessionStorage.setItem(SESSION_KEYS.FETCH_OFFSET, fetchOffset.current.toString());

    setIsFetching(false);
    return shuffleArray(allBooks);
  };

  // Keep exactly 10 books in the stack at all times
  const maintainDisplayedBooks = async () => {
    const currentDisplayed = displayedBooks.length;
    const needed = 10 - currentDisplayed;

    if (needed <= 0) return;

    // Try to use books from our cache first
    const availableFromCache = bookCache.filter(book => 
      !displayedBooks.some(displayed => displayed.id === book.id) &&
      !isDuplicateBook(book.originalBook)
    );

    let booksToAdd = availableFromCache.slice(0, needed);
    let stillNeeded = needed - booksToAdd.length;

    // If we need more books, fetch from API
    if (stillNeeded > 0 && !isFetching) {
      try {
        const freshBooks = await fetchBooksFromAPI(stillNeeded * 3); // Fetch extra to account for duplicates
        const processedBooks = processBooks(freshBooks);
        
        // Update our cache
        const newCache = [...bookCache, ...processedBooks];
        setBookCache(newCache);
        setSessionData(SESSION_KEYS.BOOK_CACHE, newCache);

        // Get the books we still need
        const additionalBooks = processedBooks.slice(0, stillNeeded);
        booksToAdd = [...booksToAdd, ...additionalBooks];
      } catch (error) {
        console.error('Error fetching additional books:', error);
      }
    }

    // Add the new books to what's displayed
    if (booksToAdd.length > 0) {
      const newDisplayed = [...displayedBooks, ...booksToAdd];
      setDisplayedBooks(newDisplayed);
      setSessionData(SESSION_KEYS.DISPLAYED_BOOKS, newDisplayed);
    }
  };

  // Load the user's reading list from localStorage
  useEffect(() => {
    const storedReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    setUserReadingList(storedReadingList);
    setIsInitialized(true);
  }, []);

  // Initialize the discover page
  useEffect(() => {
    if (!isInitialized) return;

    const initializeDiscovery = async () => {
      const sessionData = getSessionData();
      
      // Restore what we had before
      setSavedBooks(sessionData.savedBooks);
      setSwipedBooks(sessionData.swipedBooks);
      setBookCache(sessionData.bookCache);
      
      // Restore the books we've already seen
      sessionData.seenIds.forEach(id => seenBookIds.current.add(id));
      fetchOffset.current = sessionData.fetchOffsetValue;

      // Check if we have recent data we can use
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const hasRecentData = sessionData.lastFetchTime && 
                           parseInt(sessionData.lastFetchTime) > oneHourAgo;

      if (hasRecentData && sessionData.displayedBooks.length > 0) {
        // Filter out books that shouldn't be shown anymore
        const validDisplayedBooks = sessionData.displayedBooks.filter(book => 
          !isDuplicateBook(book.originalBook)
        );
        
        if (validDisplayedBooks.length >= 5) {
          setDisplayedBooks(validDisplayedBooks);
          setIsLoading(false);
          // Still make sure we have 10 books
          setTimeout(maintainDisplayedBooks, 100);
          return;
        }
      }

      // Start fresh with new books
      try {
        const freshBooks = await fetchBooksFromAPI(30);
        const processedBooks = processBooks(freshBooks);
        
        setBookCache(processedBooks);
        setSessionData(SESSION_KEYS.BOOK_CACHE, processedBooks);
        setSessionData(SESSION_KEYS.SEEN_BOOK_IDS, Array.from(seenBookIds.current));
        setSessionData(SESSION_KEYS.LAST_FETCH_TIME, Date.now().toString());
        
        const initialDisplayed = processedBooks.slice(0, 10);
        setDisplayedBooks(initialDisplayed);
        setSessionData(SESSION_KEYS.DISPLAYED_BOOKS, initialDisplayed);
        
      } catch (error) {
        console.error('Error initializing discovery:', error);
        setError('Failed to load books. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDiscovery();
  }, [isInitialized]);

  // Make sure we always have 10 books ready
  useEffect(() => {
    if (displayedBooks.length < 10 && !isLoading) {
      maintainDisplayedBooks();
    }
  }, [displayedBooks.length, isLoading]);

  // User swiped left - skip this book
  const handleSwipeLeft = (book) => {
    console.log(`Skipping: ${book.title}`);
    
    const newSwipedBooks = [...swipedBooks, book.id];
    setSwipedBooks(newSwipedBooks);
    setSessionData(SESSION_KEYS.SWIPED_BOOKS, newSwipedBooks);
    
    // Remove from what's currently displayed
    const newDisplayed = displayedBooks.filter(b => b.id !== book.id);
    setDisplayedBooks(newDisplayed);
    setSessionData(SESSION_KEYS.DISPLAYED_BOOKS, newDisplayed);
  };

  // User swiped right - save this book
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
      
      // Remove from what's currently displayed
      const newDisplayed = displayedBooks.filter(b => b.id !== book.id);
      setDisplayedBooks(newDisplayed);
      setSessionData(SESSION_KEYS.DISPLAYED_BOOKS, newDisplayed);
      
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  // Add the book to the user's reading list
  const handleAddToReadingList = async (book) => {
    try {
      const originalBook = book.originalBook;
      const title = book.title;
      const author = book.author;

      // Update local storage
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
      
      // Don't add duplicates
      const exists = readingList.some(item => item.key === originalBook.key);
      if (!exists) {
        readingList.push(bookToAdd);
        localStorage.setItem('readingList', JSON.stringify(readingList));
        setUserReadingList(readingList);
        console.log('Added to reading list:', title);
      }

      // Also save to database if user is logged in
      if (user) {
        try {
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
            status: "TO_BE_READ"
          };
          
          await insertReadingList(bookData, originalBook, user.id);
          
        } catch (error) {
          console.error('Error inserting to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Error in handleAddToReadingList:', error);
      throw error;
    }
  };

  // Get completely fresh books
  const handleRefreshBooks = async () => {
    setIsLoading(true);
    setError('');
    
    // Clear everything we've cached
    clearSessionData();
    
    // Reset all state
    setSavedBooks([]);
    setSwipedBooks([]);
    setDisplayedBooks([]);
    setBookCache([]);
    
    try {
      // Fetch brand new books
      const freshBooks = await fetchBooksFromAPI(30);
      const processedBooks = processBooks(freshBooks);
      
      // Update cache and session
      setBookCache(processedBooks);
      setSessionData(SESSION_KEYS.BOOK_CACHE, processedBooks);
      setSessionData(SESSION_KEYS.SEEN_BOOK_IDS, Array.from(seenBookIds.current));
      setSessionData(SESSION_KEYS.LAST_FETCH_TIME, Date.now().toString());
      
      // Show the first 10 books
      const initialDisplayed = processedBooks.slice(0, 10);
      setDisplayedBooks(initialDisplayed);
      setSessionData(SESSION_KEYS.DISPLAYED_BOOKS, initialDisplayed);
      
    } catch (error) {
      console.error('Error refreshing books:', error);
      setError('Failed to refresh books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner when we're starting up
  if (isLoading && displayedBooks.length === 0) {
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

  // Show error if something went wrong
  if (error && displayedBooks.length === 0) {
    return (
      <div className="discover-container">
        <h1 className="discover-title">Discover Books</h1>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={handleRefreshBooks}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-container">
      <h1 className="discover-title">Discover Books</h1>
      
      {/* Show user's progress */}
      <div className="progress-container">
        <p className="progress-text">
          {swipedBooks.length} Books Skipped   ||   {savedBooks.length} Books Saved
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
      
      {/* Button to get fresh books */}
      <div className="refresh-container">
        <button 
          className="refresh-books-button"
          onClick={handleRefreshBooks}
          disabled={isLoading || isFetching}
        >
          {isLoading ? 'Loading...' : 'Get New Books'}
        </button>
      </div>
      
      {isFetching && (
        <div className="fetching-indicator">
          <p>Loading more books...</p>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;