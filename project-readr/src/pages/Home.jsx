import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom"
import './Home.css';

export const Home = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  const navigate = useNavigate();
  const resultsPerPage = 40;

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
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
  const handleAddToReadingList = (e, book, index) => {
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
  };

  // Load more results (pagination)
  const loadMoreResults = () => {
    const nextPage = currentPage + 1;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    if (nextPage <= totalPages) {
      fetchDataSearch(nextPage);
    }
  };

  // Render book cards
  const renderBookCards = () => {
  if (!hasSearched) {
    return (
      <div className="book-card">
        <div className='book-cover'>
          <div className="book-cover-holder">
            <span>Book Cover</span>
          </div>
        </div>
        <div className='book-information'>
          <h3 className="book-titles">The Great Gatsby</h3>
          <p className="book-authors">by F. Scott Fitzgerald</p>
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
    <div className="book-card" key={index} onClick={() => handleCardClick({
      author_name: [author.name],
      author_key: [author.key],
      title: author.books[0] || 'Unknown Book'
    })}>
      
      <div className="book-cover">
        <div className="book-cover-holder">
          <img
            src={`https://covers.openlibrary.org/a/olid/${author.key}-M.jpg`}
            alt={`Photo of ${author.name}`}
            className="book-cover-holder"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <div className="book-cover-holder" style={{ display: 'none' }}>
            <span>Author Photo</span>
          </div>
        </div>
      </div>

      <div className="book-information">
        <h3 className="book-titles" title={author.name}>
          {truncateText(author.name, 50)}
        </h3>
        <p className="book-authors">
          {author.books.length} book{author.books.length !== 1 ? 's' : ''}
        </p>
        <p className="book-year">
          {truncateText(author.books.join(', '), 80)}
        </p>
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
      <div key={`${book.key}-${index}`} className="book-card" onClick={() => handleCardClick(book)}>
        <div className='book-cover'>
          {coverId ? (
            <>
              <img 
                src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
                alt={`Cover of ${title}`} 
                className="book-cover-holder"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <div className="book-cover-holder" style={{display: 'none'}}>
                <span>Book Cover</span>
              </div>
            </>
          ) : (
            <div className="book-cover-holder">
              <span>Book Cover</span>
            </div>
          )}
        </div>
      
        <div className='book-information'>
          <h3 className="book-titles" title={title}>
            {truncateText(title, 50)}
          </h3>
          <p className="book-authors" title={author}>
            by {truncateText(author, 40)}
          </p>
          {publishYear && <p className="book-year">({publishYear})</p>}
          
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

      <div className="books-grid">
        {renderBookCards()}
      </div>

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
