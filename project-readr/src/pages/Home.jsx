import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom"
import { UserAuth } from '../context/AuthContext';
import './Home.css';

export const Home = () => {
  const getDisplayResultsCount = () => {
  if (filterBy === 'Author') {
    const uniqueAuthors = new Map();
    searchResults.forEach(book => {
      if (Array.isArray(book.author_name)) {
        book.author_name.forEach((authorName) => {
          if (!uniqueAuthors.has(authorName)) {
            uniqueAuthors.set(authorName, true);
          }
        });
      }
    });
    return uniqueAuthors.size;
  }
  return searchResults.length;
}; // HELPER
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingListBooks, setReadingListBooks] = useState(new Set());
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [classicBooks, setClassicBooks] = useState([]);
  const [booksWeLove, setBooksWeLove] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchDetails, setSearchDetails] = useState({ term: '', filter: '' });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [previousSections, setPreviousSections] = useState({
    trending: [],
    classics: [],
    booksWeLove: []
  });
  const [shouldRestoreSections, setShouldRestoreSections] = useState(false);
  const [shouldRestoreSearch, setShouldRestoreSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const trendingRef = useRef(null);
  const classicsRef = useRef(null);
  const booksWeLoveRef = useRef(null);
  const resultsPerPage = 50;

  const { session, insertReadingList } = UserAuth();
  const user = session?.user;

  // Load sections data on component mount
  useEffect(() => {
    // Only load sections if we're not restoring from saved state
    const savedState = localStorage.getItem('homePageState');
    if (!savedState) {
      loadSectionsData();
    }
  }, []);

  useEffect(() => {
    if (!hasSearched && trendingBooks.length > 0 && classicBooks.length > 0 && booksWeLove.length > 0) {
      setPreviousSections({
        trending: trendingBooks,
        classics: classicBooks,
        booksWeLove: booksWeLove
      });
    }
    }, [trendingBooks, classicBooks, booksWeLove, hasSearched]);

  useEffect(() => {
    // Load existing reading list from localStorage - make it user-specific
    if (user?.id) {
      const userReadingListKey = `readingList_${user.id}`;
      const existingList = JSON.parse(localStorage.getItem(userReadingListKey) || '[]');
      const bookKeys = new Set(existingList.map(book => book.key));
      setReadingListBooks(bookKeys);
    } else {
      // If no user, clear the reading list state
      setReadingListBooks(new Set());
    }
  }, [user?.id]);

useEffect(() => {
  // Handle restoration from book page
  const savedState = localStorage.getItem('homePageState');
  if (savedState) {
    const { 
      searchTerm: savedSearchTerm,
      filterBy: savedFilterBy,
      searchResults: savedSearchResults,
      currentPage: savedCurrentPage,
      totalResults: savedTotalResults,
      hasSearched: savedHasSearched,
      searchDetails: savedSearchDetails,
      sections
    } = JSON.parse(savedState);
    
    console.log('Restoring state:', { savedHasSearched, sections }); // Debug log
    
    if (savedHasSearched && savedSearchResults && savedSearchResults.length > 0) {
      // Restore search state
      console.log('Restoring search state'); // Debug log
      setSearchTerm(savedSearchTerm);
      setFilterBy(savedFilterBy);
      setSearchResults(savedSearchResults);
      setCurrentPage(savedCurrentPage);
      setTotalResults(savedTotalResults);
      setHasSearched(savedHasSearched);
      setSearchDetails(savedSearchDetails);
      setShouldRestoreSearch(true);
    } else if (sections && (sections.trending || sections.classics || sections.booksWeLove)) {
      // Restore sections state
      console.log('Restoring sections state'); // Debug log
      if (sections.trending) setTrendingBooks(sections.trending);
      if (sections.classics) setClassicBooks(sections.classics);
      if (sections.booksWeLove) setBooksWeLove(sections.booksWeLove);
      
      setPreviousSections(sections);
      setShouldRestoreSections(true);
      setSectionsLoading(false);
      setHasSearched(false); // Ensure we show sections, not search results
    }
    
    // Clear the saved state
    localStorage.removeItem('homePageState');
    return;
  }

  // Handle auto-search from navigation (existing code)
  if (location.state?.autoSearch && location.state?.searchTerm) {
    const searchTerm = location.state.searchTerm;
    const displayTerm = location.state.displaySearchTerm || searchTerm;
    
    console.log('Auto-searching for:', searchTerm);
    console.log('Display term:', displayTerm);
    
    setHasSearched(true);
    setSearchTerm(displayTerm);
    setFilterBy(location.state?.filterBy || 'All');
    setCurrentPage(1);
    setSearchResults([]);
    setError('');
    setIsLoading(true);
    
    fetchDataSearch(1, searchTerm);
    window.history.replaceState({}, document.title);
  }
}, [location.state]);

useEffect(() => {
  // Listen for reading list changes from other components
  const handleReadingListChange = (event) => {
    if (!user?.id) return;
    
    const userReadingListKey = `readingList_${user.id}`;
    const updatedList = JSON.parse(localStorage.getItem(userReadingListKey) || '[]');
    const bookKeys = new Set(updatedList.map(book => book.key));
    setReadingListBooks(bookKeys);
  };

  // Handle custom event with specific book removal
  const handleCustomReadingListEvent = (event) => {
    if (!user?.id) return;
    
    if (event.detail && event.detail.action === 'removed' && event.detail.bookKey) {
      // Remove the specific book from the reading list state
      setReadingListBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.detail.bookKey);
        return newSet;
      });
    } else {
      // For other actions, refresh the entire list
      handleReadingListChange();
    }
  };

  // Listen for custom event
  window.addEventListener('readingListUpdated', handleCustomReadingListEvent);
  
  // Listen for storage changes (if modified in another tab)
  window.addEventListener('storage', (e) => {
    if (user?.id && e.key === `readingList_${user.id}`) {
      handleReadingListChange();
    }
  });

  return () => {
    window.removeEventListener('readingListUpdated', handleCustomReadingListEvent);
    window.removeEventListener('storage', handleReadingListChange);
  };
}, [user?.id]);

useEffect(() => {
  // Restore scroll position after loading more results
  if (isLoadingMore === false && scrollPosition > 0 && currentPage > 1) {
    console.log('Restoring scroll position to:', scrollPosition);
    
    // Use a small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto'
      });
    }, 50);
    
    return () => clearTimeout(timer);
  }
}, [isLoadingMore, scrollPosition, currentPage]);

// Function to handle reading list button click
const handleReadingListButtonClick = (e, book, index) => {
  e.stopPropagation();
  
  if (readingListBooks.has(book.key)) {
    // If book is already in reading list, redirect to ReadingList page
    window.open('/ReadingList', '_blank');
  } else {
    // If book is not in reading list, add it
    handleAddToReadingList(e, book, index);
  }
};

useEffect(() => {
  // Listen for reading list changes from other components
  const handleReadingListChange = (event) => {
    const updatedList = JSON.parse(localStorage.getItem('readingList') || '[]');
    const bookKeys = new Set(updatedList.map(book => book.key));
    setReadingListBooks(bookKeys);
  };

  // Handle custom event with specific book removal
  const handleCustomReadingListEvent = (event) => {
    if (event.detail && event.detail.action === 'removed' && event.detail.bookKey) {
      // Remove the specific book from the reading list state
      setReadingListBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.detail.bookKey);
        return newSet;
      });
    } else {
      // For other actions, refresh the entire list
      handleReadingListChange();
    }
  };

  // Listen for custom event
  window.addEventListener('readingListUpdated', handleCustomReadingListEvent);
  
  // Listen for storage changes (if modified in another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'readingList') {
      handleReadingListChange();
    }
  });

  return () => {
    window.removeEventListener('readingListUpdated', handleCustomReadingListEvent);
    window.removeEventListener('storage', handleReadingListChange);
  };
}, []);

  // Function to load all sections data
  const loadSectionsData = async () => {
    // Don't load if we're restoring state or if sections are already loaded
    if (shouldRestoreSections || (trendingBooks.length > 0 && classicBooks.length > 0 && booksWeLove.length > 0)) {
      console.log('Skipping section load - restoring or already loaded'); // Debug log
      setShouldRestoreSections(false);
      setSectionsLoading(false);
      return;
    }
    
    console.log('Loading sections data'); // Debug log
    setSectionsLoading(true);
    try {
      await Promise.all([
        loadTrendingBooks(),
        loadClassicBooks(),
        loadBooksWeLove()
      ]);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setSectionsLoading(false);
    }
  };

  // Load trending books (popular recent books)
  const loadTrendingBooks = async () => {
    try {
      // Search for popular books from recent years (2020-2024)
    const allTrendingQueries = [
      'subject:fiction trending',
      'subject:romance popular',
      'subject:fantasy bestseller',
      'subject:mystery thriller',
      'subject:science_fiction popular',
      'subject:young_adult bestseller',
      'subject:contemporary_fiction',
      'subject:horror popular',
      'subject:biography bestseller',
      'subject:self_help popular',
      'subject:historical_fiction trending',
      'subject:crime thriller'
    ];

    // Randomly select 4 queries from the array
    const shuffledQueries = allTrendingQueries.sort(() => 0.5 - Math.random());
    const queries = shuffledQueries.slice(0, 4);
      
    const allBooks = [];
    
    const sortOptions = ['rating', 'new', 'old'];
    const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];

      for (const query of queries) {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15&sort=rating&publish_year=2020,2021,2022,2023,2024`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            allBooks.push(...data.docs);
          }
        }
      }
      
      // Remove duplicates and filter books with covers
     const uniqueBooks = allBooks
      .filter((book, index, self) => 
        index === self.findIndex(b => b.key === book.key) && 
        book.cover_i && 
        book.title && 
        book.author_name
      )
      .sort(() => 0.5 - Math.random()) // Randomize the order
      .slice(0,50);
          
      setTrendingBooks(uniqueBooks);
    } catch (error) {
      console.error('Error loading trending books:', error);
      // Fallback to a simple search if the complex query fails
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=fiction&limit=15&sort=rating`
        );
        if (response.ok) {
          const data = await response.json();
          setTrendingBooks(data.docs?.filter(book => book.cover_i) || []);
        }
      } catch (fallbackError) {
        console.error('Fallback trending books failed:', fallbackError);
      }
    }
  };

  // Load classic books (books published before 1980)
  const loadClassicBooks = async () => {
    try {
    const allClassicQueries = [
      'subject:classics literature',
      'subject:american_literature',
      'subject:english_literature',
      'subject:world_literature',
      'subject:victorian_literature',
      'subject:modernist_literature',
      'subject:russian_literature',
      'subject:french_literature',
      'subject:philosophy classic',
      'subject:poetry classic',
      'subject:drama classic',
      'subject:gothic_literature'
    ];

    // Randomly select 4 queries from the array
    const shuffledQueries = allClassicQueries.sort(() => 0.5 - Math.random());
    const queries = shuffledQueries.slice(0, 4);
      
      const allBooks = [];
      
      for (const query of queries) {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15&sort=rating&publish_year=[* TO 1980]`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            allBooks.push(...data.docs);
          }
        }
      }
      
      // Remove duplicates and filter books with covers
      const uniqueBooks = allBooks
      .filter((book, index, self) => 
        index === self.findIndex(b => b.key === book.key) && 
        book.cover_i && 
        book.title && 
        book.author_name &&
        book.first_publish_year && 
        book.first_publish_year <= 1980
      )
      .sort(() => 0.5 - Math.random()) // Randomize the order
      .slice(0, 50);
      
      setClassicBooks(uniqueBooks);
    } catch (error) {
      console.error('Error loading classic books:', error);
      // Fallback search
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=classics&limit=50&sort=rating`
        );
        if (response.ok) {
          const data = await response.json();
          setClassicBooks(data.docs?.filter(book => book.cover_i && book.first_publish_year && book.first_publish_year <= 1980) || []);
        }
      } catch (fallbackError) {
        console.error('Fallback classic books failed:', fallbackError);
      }
    }
  };

  // Load books we love (highly rated books across genres)
  const loadBooksWeLove = async () => {
    try {
      const queries = [
        'subject:award_winners',
        'subject:bestsellers',
        'subject:prize_winners',
        'subject:literary_fiction'
      ];
      
      const allBooks = [];
      
      for (const query of queries) {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15&sort=rating`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.docs) {
            allBooks.push(...data.docs);
          }
        }
      }
      
      // Remove duplicates and filter books with covers
      const uniqueBooks = allBooks
        .filter((book, index, self) => 
          index === self.findIndex(b => b.key === book.key) && 
          book.cover_i && 
          book.title && 
          book.author_name
        )
        .slice(0, 50);
      
      setBooksWeLove(uniqueBooks);
    } catch (error) {
      console.error('Error loading books we love:', error);
      // Fallback search
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=award winners&limit=30&sort=rating`
        );
        if (response.ok) {
          const data = await response.json();
          setBooksWeLove(data.docs?.filter(book => book.cover_i) || []);
        }
      } catch (fallbackError) {
        console.error('Fallback books we love failed:', fallbackError);
      }
    }
  };

  // Scroll functions for different sections
  const scrollSection = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Helper function to get title class based on length
  const getTitleClass = (title) => {
      if (!title) return 'book-titles';
      const length = title.length;
      if (length > 45) return 'book-titles very-long-title';
      if (length > 30) return 'book-titles long-title';
      return 'book-titles';
    };

    // Helper function to get author class based on length
    const getAuthorClass = (author) => {
      if (!author) return 'book-authors';
      const length = author.length;
      if (length > 40) return 'book-authors very-long-author';
      if (length > 20) return 'book-authors long-author';
      return 'book-authors';
    };

    // Helper function to get year class (smaller if title/author are long)
    const getYearClass = (title, author) => {
      const titleLength = title ? title.length : 0;
      const authorLength = author ? author.length : 0;
      const totalLength = titleLength + authorLength;
      
      if (totalLength > 80) return 'book-year small-year';
      return 'book-year';
    };

  // Fetch search results
  const fetchDataSearch = async (page = 1, searchQuery = searchTerm) => {
    console.log('fetchDataSearch called with:', { page, searchQuery, filterBy });
    
    if (!searchQuery?.trim()) {
      setError('Please enter a book title.');
      return;
    }

    // Set loading states
    setIsLoading(true);
    setError('');
    
    // Track if this is loading more results
    const loadingMore = page > 1;
    setIsLoadingMore(loadingMore);
    
    if (page === 1) {
      setSearchResults([]);
      setHasSearched(true);
      setScrollPosition(0); // Reset scroll position for new searches
    }

    try {
      const offset = (page - 1) * resultsPerPage;
      let searchUrl;
      const encodedTitle = encodeURIComponent(searchQuery);
      
      console.log('Search query:', searchQuery);
      console.log('Filter by:', filterBy);
      
      // Check if it's a subject search (from genre page)
      if (searchQuery.startsWith('subject:')) {
        searchUrl = `https://openlibrary.org/search.json?q=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
        console.log('Using subject search URL:', searchUrl);
      } else {
        // Regular search logic
        switch (filterBy) {
          case 'Title':
            searchUrl = `https://openlibrary.org/search.json?title=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
            break;
          case 'Author':
            searchUrl = `https://openlibrary.org/search.json?author=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
            break;
          case 'Subject':
            searchUrl = `https://openlibrary.org/search.json?subject=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
            break;
          case 'All':
          default:
            searchUrl = `https://openlibrary.org/search.json?q=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
            break;
        }
      }

      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Search results:', data);
      console.log('Number of results:', data.docs?.length || 0);
      
      if (page === 1) {
        setSearchResults(data.docs || []);
      } else {
        setSearchResults(prev => [...prev, ...(data.docs || [])]);
      }
      
      setSearchDetails({ term: searchQuery, filter: filterBy });
      setTotalResults(data.numFound || 0);
      setCurrentPage(page);

    } catch (error) {
      console.error("Fetch error:", error);
      
      let errorMessage = "Error fetching data. Please try again.";
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes('HTTP error')) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Fetch author details or filter author matches
  const fetchSelectedAuthor = async (index, key, name) => {
    try {
      setIsLoading(true);
      setError('');
      setSearchResults([]); // optional: clear previous results
      setHasSearched(true);

      // Search books by selected author name
      const encodedAuthor = encodeURIComponent(name);
      const response = await fetch(`https://openlibrary.org/search.json?author=${encodedAuthor}&limit=${resultsPerPage}&offset=0`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setSearchTerm(name);        // Update search bar with author
      setFilterBy('Author');      // Optional: auto-set filter
      setSearchResults(data.docs || []);
      setTotalResults(data.numFound || 0);
      setCurrentPage(1);
    } catch (error) {
      console.error("Fetch author error:", error);
      setError("Error loading author details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchDataSearch(1);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle filter change
  useEffect(() => {
    if (hasSearched && searchTerm.trim()) {
      setCurrentPage(1);
      fetchDataSearch(1);
    }
  }, [filterBy]);

const handleCardClick = (book) => {
    // Save current state to localStorage
    const currentState = {
      searchTerm,
      filterBy,
      searchResults,
      currentPage,
      totalResults,
      hasSearched,
      searchDetails,
      sections: hasSearched ? null : {
        trending: trendingBooks,
        classics: classicBooks,
        booksWeLove: booksWeLove
      }
    };
    
    localStorage.setItem('homePageState', JSON.stringify(currentState));
    localStorage.setItem('selectedBook', JSON.stringify(book));
    
    if (filterBy === 'Author') {
      // Clean the author key if it exists
      let cleanAuthorKey = null;
      if (book.author_key && Array.isArray(book.author_key)) {
        cleanAuthorKey = book.author_key[0];
      } else if (book.authorKey) {
        cleanAuthorKey = book.authorKey;
      } else if (book.key) {
        cleanAuthorKey = book.key;
      }
      
      // Clean the key format
      if (cleanAuthorKey && cleanAuthorKey.startsWith('/authors/')) {
        cleanAuthorKey = cleanAuthorKey.replace('/authors/', '');
      }
      
      navigate('/author', {
        state: {
          authorName: book.author_name ? book.author_name[0] : (book.authorName || book.name),
          authorKey: cleanAuthorKey
        }
      });
    } else {
      navigate('/Book');
    }
  };

const handleAddToReadingList = async (e, book, index) => {
  e.stopPropagation();
  
  if (!user?.id) {
    console.error('User not authenticated');
    return;
  }

  const title = book.title?.trim() || "No title available";
  const author = Array.isArray(book.author_name) && book.author_name.length > 0
    ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
    : "Unknown author";
  const editionCount = book.edition_count || "Unknown";

  // Get existing reading list
  const userReadingListKey = `readingList_${user.id}`;
  let readingList = JSON.parse(localStorage.getItem(userReadingListKey) || '[]');
  const bookToAdd = {
    title: title,
    author: author,
    key: book.key,
    cover_id: book.cover_i,
    publish_year: book.first_publish_year,
    edition_count: editionCount
  };
  
  // Check if book is already in reading list
  const exists = readingList.some(item => item.key === book.key);
  if (!exists) {
    readingList.push(bookToAdd);
    localStorage.setItem(userReadingListKey, JSON.stringify(readingList));
    
    // Update the state to reflect the change
    setReadingListBooks(prev => new Set([...prev, book.key]));
  }

  // Insert to Supabase
  try {
    console.log("Book title: ", title);
    console.log("Author: ", author);
    const toBeRead = "TO_BE_READ";

    const bookData = {
      user_id: user.id,
      book_key: book.key,
      title: title,
      author: author,
      cover_id: book.cover_i,
      publish_year: book.first_publish_year,
      edition_count: editionCount, // Add this line
      isbn: book.isbn ? book.isbn[0] : null,
      subject: book.subject ? book.subject.slice(0, 5).join(", ") : null,
      added_at: new Date().toISOString(),
      status: toBeRead
    };
    
    const result = await insertReadingList(bookData, book, user.id);
  } catch (error) {
    console.error('Error handling add to reading list:', error);
    // If there's an error, revert the local state
    setReadingListBooks(prev => {
      const newSet = new Set(prev);
      newSet.delete(book.key);
      return newSet;
    });
  }
};

const handleRemoveFromReadingList = async (bookKey) => {
  if (!user?.id) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    // Remove from user-specific localStorage
    const userReadingListKey = `readingList_${user.id}`;
    let readingList = JSON.parse(localStorage.getItem(userReadingListKey) || '[]');
    readingList = readingList.filter(item => item.key !== bookKey);
    localStorage.setItem(userReadingListKey, JSON.stringify(readingList));
    
    // Update the state to reflect the change
    setReadingListBooks(prev => {
      const newSet = new Set(prev);
      newSet.delete(bookKey);
      return newSet;
    });
    
    // function to remove from database here pero in readinglist implementation alr so iono
    
  } catch (error) {
    console.error('Error removing from reading list:', error);
  }
};

const refreshReadingListState = () => {
  if (!user?.id) {
    setReadingListBooks(new Set());
    return;
  }
  
  const userReadingListKey = `readingList_${user.id}`;
  const updatedList = JSON.parse(localStorage.getItem(userReadingListKey) || '[]');
  const bookKeys = new Set(updatedList.map(book => book.key));
  setReadingListBooks(bookKeys);
};

  // Load more results (pagination)
  const loadMoreResults = () => {
    const nextPage = currentPage + 1;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    if (nextPage <= totalPages) {
      // Save current scroll position before loading more
      const currentScrollY = window.scrollY;
      setScrollPosition(currentScrollY);
      
      console.log('Loading more results, saving scroll position:', currentScrollY);
      
      fetchDataSearch(nextPage);
    }
  };
  
  // Recommendation Card Component
const RecommendationCard = ({ book, sections, onReadingListButtonClick, readingListBooks }) => {
  const title = book.title?.trim() || "No title available";
  const author = Array.isArray(book.author_name) && book.author_name.length > 0
    ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
    : "Unknown author";
  const coverId = book.cover_i?.toString().trim() ? book.cover_i : null;
  const publishYear = book.first_publish_year || '';

  const handleRecommendationClick = (e) => {
    // Don't navigate if clicking on the button
    if (e.target.closest('.add-to-list-btn')) {
      return;
    }
    
    // Save the book data
    localStorage.setItem('selectedBook', JSON.stringify(book));
    
    // Open new tab with URL parameter to hide back button
    const newTab = window.open('/Book?hideBack=true', '_blank');
    
    // Alternative approach: Set a timestamp-based flag that expires quickly
    // This ensures the flag is only used once
    const timestamp = Date.now();
    localStorage.setItem('hideBackButton', JSON.stringify({
      value: true,
      timestamp: timestamp,
      expires: timestamp + 5000 // 5 seconds expiry
    }));
  };

  const handleReadingListClick = (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (readingListBooks.has(book.key)) {
      // If book is already in reading list, redirect to ReadingList page
      window.open('/ReadingList', '_blank');
    } else {
      // If book is not in reading list, add it
      onReadingListButtonClick(e, book, 0);
    }
  };

  const isInReadingList = readingListBooks.has(book.key);

  return (
    <div className="books-card" onClick={handleRecommendationClick}>
      <div className='books-cover'>
        {coverId ? (
          <>
            <img 
              src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
              alt={`Cover of ${title}`} 
              className="books-cover-holder"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <div className="books-cover-holder" style={{display: 'none'}}>
              <span>Book Cover</span>
            </div>
          </>
        ) : (
          <div className="books-cover-holder">
            <span>Book Cover</span>
          </div>
        )}
      </div>
    
      <div className='book-information'>
        <div className='book-text-group'>
          <h3 className={getTitleClass(title)} title={title}>
            {truncateText(title, 50)}
          </h3>
          <p className={getAuthorClass(author)} title={author}>
            by {truncateText(author, 40)}
          </p>
          {publishYear && <p className={getYearClass(title, author)}>({publishYear})</p>}
        </div>
        <button 
          className={`add-to-list-btn ${isInReadingList ? 'in-reading-list' : ''}`}
          onClick={handleReadingListClick}
        >
          {isInReadingList ? 'In Reading List' : 'Add to Reading List'}
        </button>
      </div>
    </div>
  );
};

  // Loading component for sections
  const SectionLoading = () => (
    <div className="recommendations-grid">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="books-card loading-card">
          <div className="books-cover">
            <div className="books-cover-holder loading-placeholder">
              <span>Loading...</span>
            </div>
          </div>
          <div className="book-information">
            <div className="loading-text"></div>
            <div className="loading-text short"></div>
          </div>
        </div>
      ))}
    </div>
  );

const handleFeelingLucky = () => {
  const luckyKeywords = [
  // Fiction genres
  'adventure', 'mystery', 'romance', 'thriller', 'fantasy', 'science fiction',
  'horror', 'historical fiction', 'contemporary fiction', 'literary fiction',
  'dystopian', 'magical realism', 'urban fantasy', 'paranormal romance',
  'cozy mystery', 'psychological thriller', 'space opera', 'steampunk',
  'cyberpunk', 'post-apocalyptic', 'time travel', 'alternate history',
  'fairy tale retelling', 'noir', 'gothic fantasy', 'speculative fiction',
  'cli-fi', 'metafiction',

  // Non-fiction genres
  'biography', 'memoir', 'self-help', 'history', 'philosophy', 'psychology',
  'science', 'technology', 'business', 'cooking', 'travel', 'health',
  'fitness', 'spirituality', 'politics', 'economics', 'art', 'music',
  'photography', 'nature', 'environment', 'education', 'parenting',
  'productivity', 'leadership', 'true crime', 'journalism', 'essay collection',

  // Classic literature
  'classic literature', 'victorian literature', 'american literature',
  'british literature', 'world literature', 'poetry', 'drama', 'essays',
  'russian literature', 'french literature', 'gothic literature',
  'greek classics', 'modernist literature', 'existentialist literature',

  // Popular themes
  'coming of age', 'family saga', 'friendship', 'love story', 'war',
  'survival', 'redemption', 'betrayal', 'courage', 'hope', 'dreams',
  'identity', 'belonging', 'justice', 'freedom', 'sacrifice', 'forgiveness',
  'loss', 'revenge', 'healing', 'isolation', 'found family', 'second chances',

  // Specific subjects
  'dragons', 'vampires', 'pirates', 'knights', 'detectives', 'spies',
  'robots', 'aliens', 'magic', 'witches', 'ghosts', 'zombies', 'werewolves',
  'superheroes', 'assassins', 'thieves', 'royalty', 'warriors', 'rebels',
  'clones', 'artificial intelligence', 'mythical creatures', 'doppelgangers',

  // Time periods
  'medieval', 'renaissance', 'victorian', 'world war', 'civil war',
  'ancient egypt', 'ancient rome', 'ancient greece', 'wild west',
  'roaring twenties', 'great depression', 'cold war', 'future',
  'prehistoric', 'industrial revolution', 'space age', '1980s', '2000s',

  // Settings
  'small town', 'big city', 'island', 'mountain', 'desert', 'forest',
  'castle', 'spaceship', 'underwater', 'underground', 'haunted house',
  'boarding school', 'hospital', 'prison', 'farm', 'cafe', 'library',
  'circus', 'orphanage', 'dystopian city', 'virtual reality',

  // Awards and recognition
  'pulitzer prize', 'nobel prize', 'booker prize', 'hugo award',
  'newbery medal', 'caldecott medal', 'national book award', 'bestseller',
  'award winner', 'prize winner', 'critically acclaimed', 'book club pick',
  'goodreads choice', 'nytimes bestseller', 'staff pick', 'oprah book club',

  // Mood/tone
  'heartwarming', 'inspiring', 'uplifting', 'emotional', 'funny',
  'humorous', 'witty', 'dark', 'mysterious', 'suspenseful', 'romantic',
  'adventurous', 'thrilling', 'peaceful', 'nostalgic', 'thought-provoking',
  'gritty', 'melancholic', 'wholesome', 'bittersweet', 'absurd', 'quirky',

  // Age groups
  'young adult', 'middle grade', 'children', 'adult fiction', 'new adult',
  'early reader', 'picture books', 'chapter books',

  // Popular series/franchises (generic terms)
  'series', 'trilogy', 'saga', 'chronicles', 'tales', 'adventures',
  'epic', 'installment', 'spin-off', 'anthology',

  // Reading preferences
  'page turner', 'quick read', 'beach read', 'comfort read', 'escapist',
  'educational', 'informative', 'entertaining', 'challenging', 'easy read',
  'slow burn', 'fast-paced', 'character driven', 'plot driven',
  'short stories', 'long reads', 'standalone', 'must read', 'hidden gem'
];


  // Randomly select a keyword
  const randomKeyword = luckyKeywords[Math.floor(Math.random() * luckyKeywords.length)];
  
  // Set the search term and perform the search
  setSearchTerm(randomKeyword);
  setFilterBy('All');
  setCurrentPage(1);
  setHasSearched(true);
  
  // Perform the search with the random keyword
  fetchDataSearch(1, randomKeyword);
};

  // Render book cards
  const renderBookCards = () => {
    if (!hasSearched) {
      return (
        <div className="books-card">
          <div className='books-cover'>
            <div className="books-cover-holder">
              <span>Book Cover</span>
            </div>
          </div>
          <div className='book-information'>
            <div className="book-text-group">
              <h3 className="book-titles">The Great Gatsby</h3>
              <p className="book-authors">by F. Scott Fitzgerald</p>
            </div>
            <button className="add-to-list-btn">
              Add to Reading List
            </button>
          </div>
        </div>
      );
    }

    if (isLoading && searchResults.length === 0) {
      return <div className="loading">Searching for books...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      );
    }

    // 📘 If author view
    if (filterBy === 'Author' && searchResults.length > 0) {
      const uniqueAuthors = new Map();

      searchResults.forEach(book => {
        if (Array.isArray(book.author_name)) {
          book.author_name.forEach((authorName, i) => {
            if (!uniqueAuthors.has(authorName)) {
              uniqueAuthors.set(authorName, {
                name: authorName,
                key: Array.isArray(book.author_key) ? book.author_key[i] : null,
                books: [book.title],
                // Add bio from book data if available
                bio: book.author_bio || null
              });
            } else {
              const existing = uniqueAuthors.get(authorName);
              if (book.title && !existing.books.includes(book.title)) {
                existing.books.push(book.title);
              }
              // Update bio if we don't have one yet
              if (!existing.bio && book.author_bio) {
                existing.bio = book.author_bio;
              }
            }
          });
        }
      });

      return Array.from(uniqueAuthors.values()).map((author, index) => (
        <div className="h-author-card" key={index} onClick={() => handleCardClick({
          authorName: author.name,
          authorKey: author.key,
          title: author.books[0] || 'Unknown Book'
        })}>
        
        <div className="h-author-photo">
          <div className="h-author-photo-holder">
            {author.key ? (
              <>
                <img
                  src={`https://covers.openlibrary.org/a/olid/${author.key}-M.jpg`}
                  alt={`Photo of ${author.name}`}
                  className="h-author-photo-holder"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="h-author-photo-holder" style={{ display: 'none' }}>
                  <span>No Photo Available</span>
                </div>
              </>
            ) : (
              <div className="h-author-photo-holder">
                <span>No Photo Available</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-author-information">
          <div className='h-author-text-group'>
            <h3 className={getTitleClass(author.name)} title={author.name}>
              {truncateText(author.name, 50)}
            </h3>
          </div>
        </div>

        </div>
      ));
    }

    // 📚 Otherwise, render books
    return searchResults.map((book, index) => {
      const title = book.title?.trim() || "No title available";
      const author = Array.isArray(book.author_name) && book.author_name.length > 0
        ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
        : "Unknown author";
      const coverId = book.cover_i?.toString().trim() ? book.cover_i : null;
      const publishYear = book.first_publish_year || '';

      return (
        <div key={`${book.key}-${index}`} className="books-card" onClick={() => handleCardClick(book)}>
          <div className='books-cover'>
            {coverId ? (
              <>
                <img 
                  src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
                  alt={`Cover of ${title}`} 
                  className="books-cover-holder"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="books-cover-holder" style={{display: 'none'}}>
                  <span>Book Cover</span>
                </div>
              </>
            ) : (
              <div className="books-cover-holder">
                <span>Book Cover</span>
              </div>
            )}
          </div>
        
          <div className='book-information'>
            <div className='book-text-group'>
              <h3 className={getTitleClass(title)} title={title}>
                {truncateText(title, 50)}
              </h3>
              <p className={getAuthorClass(author)} title={author}>
                by {truncateText(author, 40)}
              </p>
              {publishYear && <p className={getYearClass(title, author)}>({publishYear})</p>}
            </div>
              <button 
                className={`add-to-list-btn ${readingListBooks.has(book.key) ? 'in-reading-list' : ''}`}
                onClick={(e) => handleReadingListButtonClick(e, book, index)}
              >
                {readingListBooks.has(book.key) ? 'In Reading List' : 'Add to Reading List'}
              </button>
          </div>
        </div>
      );
    });
  };

  //const clearAndRebuildReadingList = () => {
  // Clear the localStorage
     // localStorage.removeItem('readingList');
      
      // Reset the state
    //  setReadingListBooks(new Set());
      
      // If you have Supabase data, you can rebuild from there
      // Otherwise, start fresh
    //  console.log('Reading list cleared and reset');
    //  alert('Reading list has been cleared. You can now add books fresh.');
    //};

  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const hasMoreResults = currentPage < totalPages;

 return (
  
  <div className="home-container">
    <header className="header">
      <div className="controls">
        <h1 className="pages-title">Meet your next favorite read!</h1>
        <div className="search-controls">
          <div className="search-row">
            <select 
              className="filter-dropdown"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Title">Title</option>
              <option value="Author">Author</option>
              <option value="Subject">Subject</option>
            </select>
            {/*<button 
                    className="clear-reading-list-btn" 
                    onClick={clearAndRebuildReadingList}
                    style={{ 
                      marginLeft: '10px', 
                      padding: '5px 10px', 
                      fontSize: '12px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                    >
                  Clear Reading List(Reset)
            </button> */}
            <input
              type="text"
              className="search-bar"
              placeholder="Search books, subject, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <button 
              className="search-button"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <button
            className="feeling-lucky-button"
            onClick={handleFeelingLucky}
            disabled={isLoading}
          >
            Feeling Lucky..?
          </button>
        </div>
      </div>
    </header>

      {/* Show default sections when no search has been performed */}
      {!hasSearched && (
        <div className="home-sections">
          {/* Trending Books Section */}
          <div className="h-recommendations-section">
            <div className="rcontainer">
              <h2 className="h-section-title">Trending Books</h2>
              <div className="recommendations-container">
                <button 
                  className="scroll-button left" 
                  onClick={() => scrollSection(trendingRef, 'left')}
                  aria-label="Scroll left"
                >
                  &#8249;
                </button>
                
                <div className="recommendations-scroll-wrapper">
                  <div className="recommendations-grid" ref={trendingRef}>
                    {sectionsLoading ? (
                      <SectionLoading />
                    ) : (
                      trendingBooks.map(book => (
                        <RecommendationCard 
                          key={book.key} 
                          book={book} 
                          sections={{
                            trending: trendingBooks,
                            classics: classicBooks,
                            booksWeLove: booksWeLove
                          }}
                          onReadingListButtonClick={handleReadingListButtonClick}
                          readingListBooks={readingListBooks}
                        />
                      ))
                    )}
                  </div>
                </div>
                
                <button 
                  className="scroll-button right" 
                  onClick={() => scrollSection(trendingRef, 'right')}
                  aria-label="Scroll right"
                >
                  &#8250;
                </button>
              </div>
            </div>
          </div>

          {/* Classic Books Section */}
          <div className="h-recommendations-section">
            <div className="rcontainer">
              <h2 className="h-section-title">Classic Books</h2>
              <div className="recommendations-container">
                <button 
                  className="scroll-button left" 
                  onClick={() => scrollSection(classicsRef, 'left')}
                  aria-label="Scroll left"
                >
                  &#8249;
                </button>
                
                <div className="recommendations-scroll-wrapper">
                  <div className="recommendations-grid" ref={classicsRef}>
                    {sectionsLoading ? (
                      <SectionLoading />
                    ) : (
                      classicBooks.map(book => (
                      <RecommendationCard 
                          key={book.key} 
                          book={book} 
                          sections={{
                            trending: trendingBooks,
                            classics: classicBooks,
                            booksWeLove: booksWeLove
                          }}
                          onReadingListButtonClick={handleReadingListButtonClick}
                          readingListBooks={readingListBooks}
                        />
                      ))
                    )}
                  </div>
                </div>
                
                <button 
                  className="scroll-button right" 
                  onClick={() => scrollSection(classicsRef, 'right')}
                  aria-label="Scroll right"
                >
                  &#8250;
                </button>
              </div>
            </div>
          </div>

          {/* Books We Love Section */}
          <div className="h-recommendations-section">
            <div className="rcontainer">
              <h2 className="h-section-title">Books We Love</h2>
              <div className="recommendations-container">
                <button 
                  className="scroll-button left" 
                  onClick={() => scrollSection(booksWeLoveRef, 'left')}
                  aria-label="Scroll left"
                >
                  &#8249;
                </button>
                
                <div className="recommendations-scroll-wrapper">
                  <div className="recommendations-grid" ref={booksWeLoveRef}>
                    {sectionsLoading ? (
                      <SectionLoading />
                    ) : (
                      booksWeLove.map(book => (
                      <RecommendationCard 
                          key={book.key} 
                          book={book} 
                          sections={{
                            trending: trendingBooks,
                            classics: classicBooks,
                            booksWeLove: booksWeLove
                          }}
                          onReadingListButtonClick={handleReadingListButtonClick}
                            readingListBooks={readingListBooks}
                        />
                      ))
                    )}
                  </div>
                </div>
                <button 
                  className="scroll-button right" 
                  onClick={() => scrollSection(booksWeLoveRef, 'right')}
                  aria-label="Scroll right"
                >
                  &#8250;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show search results when search has been performed */}
      {hasSearched && !isLoading && (
        <div className= "rcontainer">
          {(searchResults.length > 0 || totalResults > 0) ? (
            <>
              <div className="search-details">
                <h2 className="search-details-title">
                  Showing Results for "{searchDetails.term}" ({searchDetails.filter})
                </h2>
                <p className="search-details-info">
                  Displaying {searchResults.length} results out of {totalResults.toLocaleString()}.
                </p>
              </div>
              
              <div className="books-grid-home">
                {renderBookCards()}
              </div>
            </>
          ) : (
            <div className="search-details">
              <h2 className="search-details-title">
                No results found for "{searchDetails.term}" ({searchDetails.filter})
              </h2>
              <p className="search-details-info">
                Try a different search term or check your spelling.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Load more button for pagination */}
      {hasSearched && searchResults.length > 0 && hasMoreResults && (
        <div className="pagination-container">
          <button 
            className="load-more-btn"
            onClick={loadMoreResults}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : `Load More (${currentPage} of ${totalPages})`}
          </button>

          <button 
            className="back-to-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to Top
          </button>
        </div>
      )}

      {/* Results info */}
      {hasSearched && totalResults > 0 && (
        <div className="results-info">
          Showing {searchResults.length} of {totalResults.toLocaleString()} results
        </div>
      )}
    </div>
  );
};

export default Home;
