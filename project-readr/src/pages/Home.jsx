import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom"
import { UserAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './Home.css';

export const Home = () => {
  // State management
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [classicBooks, setClassicBooks] = useState([]);
  const [booksWeLove, setBooksWeLove] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  const [filterBy, setFilterBy] = useState(filter);

  
  const navigate = useNavigate();
  const trendingRef = useRef(null);
  const classicsRef = useRef(null);
  const booksWeLoveRef = useRef(null);
  const resultsPerPage = 50;
  const location = useLocation();
  const { query = '', filter = 'All' } = location.state || {};


  const { session, insertReadingList } = UserAuth();
  const user = session?.user;

  // Load sections data on component mount
  useEffect(() => {
    loadSectionsData();
  }, []);

  // Function to load all sections data
  const loadSectionsData = async () => {
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
      const queries = [
        'subject:fiction trending',
        'subject:romance popular',
        'subject:fantasy bestseller',
        'subject:mystery thriller'
      ];
      
      const allBooks = [];
      
      for (const query of queries) {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&sort=rating&publish_year=2020,2021,2022,2023,2024`
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
        .slice(0, 20);
      
      setTrendingBooks(uniqueBooks);
    } catch (error) {
      console.error('Error loading trending books:', error);
      // Fallback to a simple search if the complex query fails
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=fiction&limit=20&sort=rating`
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
      const queries = [
        'subject:classics literature',
        'subject:american_literature',
        'subject:english_literature',
        'subject:world_literature'
      ];
      
      const allBooks = [];
      
      for (const query of queries) {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&sort=rating&publish_year=[* TO 1980]`
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
        .slice(0, 20);
      
      setClassicBooks(uniqueBooks);
    } catch (error) {
      console.error('Error loading classic books:', error);
      // Fallback search
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=classics&limit=20&sort=rating`
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
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&sort=rating`
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
        .slice(0, 20);
      
      setBooksWeLove(uniqueBooks);
    } catch (error) {
      console.error('Error loading books we love:', error);
      // Fallback search
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=award winners&limit=20&sort=rating`
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
    if (!searchQuery?.trim()) {
      setError('Please enter a book title.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    if (page === 1) {
      setSearchResults([]);
      setHasSearched(true);
    }

    try {
      const offset = (page - 1) * resultsPerPage;
      let searchUrl;
      const encodedTitle = encodeURIComponent(searchQuery);
      
      switch (filterBy) {
        case 'Title':
          searchUrl = `https://openlibrary.org/search.json?title=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
          break;
        case 'Author':
          searchUrl = `https://openlibrary.org/search.json?author=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
          break;
        case 'All':
        default:
          searchUrl = `https://openlibrary.org/search.json?q=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
          break;
      }

      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (page === 1) {
        setSearchResults(data.docs || []);
      } else {
        setSearchResults(prev => [...prev, ...(data.docs || [])]);
      }
      
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

  // Handle book card click
  const handleCardClick = (book) => {
    // Store book data for the next page
    localStorage.setItem('selectedBook', JSON.stringify(book));
    
    if (filterBy === 'Author') {
      // For author searches, navigate to author page with first author
      const authorName = Array.isArray(book.author_name) && book.author_name.length > 0 
        ? book.author_name[0]
        : 'Unknown Author';
      navigate('/Author', { state: { authorName } });
    } else {
      // For title/all searches, navigate to book page
      navigate('/Book');
    }
  };

  // Handle add to reading list
  const handleAddToReadingList = async (e, book, index) => {
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
      publish_year: book.first_publish_year
    };
    
    // Check if book is already in reading list
    const exists = readingList.some(item => item.key === book.key);
    if (!exists) {
      readingList.push(bookToAdd);
      localStorage.setItem('readingList', JSON.stringify(readingList));
      
      // Show success feedback (you could use a toast library here)
      alert('Added to reading list!');
    } else {
      alert('Book already in reading list!');
    }

      // Insert to Supabase - uwu duje
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
          isbn: book.isbn ? book.isbn[0] : null,
          subject: book.subject ? book.subject.slice(0, 5).join(", ") : null,
          added_at: new Date().toISOString(),
          status: toBeRead
         };
         
    const result = await insertReadingList(bookData, book, user.id);

     }catch (error) {
    console.error('Error handling add to reading list:', error);
    alert('An error occurred. Please try again.');
     }
  };

  // Load more results (pagination)
  const loadMoreResults = () => {
    const nextPage = currentPage + 1;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    if (nextPage <= totalPages) {
      fetchDataSearch(nextPage);
    }
  };

  // Recommendation Card Component
  const RecommendationCard = ({ book }) => {
    const title = book.title?.trim() || "No title available";
    const author = Array.isArray(book.author_name) && book.author_name.length > 0
      ? book.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
      : "Unknown author";
    const coverId = book.cover_i?.toString().trim() ? book.cover_i : null;
    const publishYear = book.first_publish_year || '';

    return (
      <div className="books-card" onClick={() => handleCardClick(book)}>
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
            className="add-to-list-btn"
            onClick={(e) => handleAddToReadingList(e, book, 0)}
          >
            Add to Reading List
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

    if (searchResults.length === 0 && hasSearched) {
      return (
        <div className="no-results">
          <h3>No results found</h3>
          <p>Try a different search term or check your spelling.</p>
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
                books: [book.title]
              });
            } else {
              const existing = uniqueAuthors.get(authorName);
              if (book.title && !existing.books.includes(book.title)) {
                existing.books.push(book.title);
              }
            }
          });
        }
      });

      return Array.from(uniqueAuthors.values()).map((author, index) => (
      <div className="books-card" key={index} onClick={() => handleCardClick({
        author_name: [author.name],
        author_key: [author.key],
        title: author.books[0] || 'Unknown Book'
      })}>
        
        <div className="books-cover">
          <div className="books-cover-holder">
            <img
              src={`https://covers.openlibrary.org/a/olid/${author.key}-M.jpg`}
              alt={`Photo of ${author.name}`}
              className="books-cover-holder"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <div className="books-cover-holder" style={{ display: 'none' }}>
              <span>Author Photo</span>
            </div>
          </div>
        </div>

        <div className="book-information">
          <div className='book-text-group'>
            <h3 className={getTitleClass(title)} title={title}>
              {truncateText(title, 50)}
            </h3>
            <p className={getAuthorClass(author)} title={author}>
              by {truncateText(author, 40)}
            </p>
            {publishYear && <p className={getYearClass(title, author)}>({publishYear})</p>}
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
              className="add-to-list-btn"
              onClick={(e) => handleAddToReadingList(e, book, index)}
            >
              Add to Reading List
            </button>
          </div>
        </div>
      );
    });
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const hasMoreResults = currentPage < totalPages;

  return (
    <div className="home-container">
      <header className="header">
        <div className="controls">
          <h1 className="pages-title">Meet your next favorite read!</h1>

          <div className="search-controls">
            <select 
              className="filter-dropdown"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Title">Title</option>
              <option value="Author">Author</option>
            </select>
            
            <input
              type="text"
              className="search-bar"
              placeholder="Search for books by title, or author..."
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
        </div>
      </header>

      {/* Show default sections when no search has been performed */}
      {!hasSearched && (
        <div className="home-sections">
          {/* Trending Books Section */}
          <div className="recommendations-section">
            <div className="rcontainer">
              <h2 className="section-title">Trending Books</h2>
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
                        <RecommendationCard key={book.key} book={book} />
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
          <div className="recommendations-section">
            <div className="rcontainer">
              <h2 className="section-title">Classic Books</h2>
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
                        <RecommendationCard key={book.key} book={book} />
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
          <div className="recommendations-section">
            <div className="rcontainer">
              <h2 className="section-title">Books We Love</h2>
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
                        <RecommendationCard key={book.key} book={book} />
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
      {hasSearched && (
        <div className= "rcontainer">
          <div className="books-grid-home">
            {renderBookCards()}
          </div>
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
