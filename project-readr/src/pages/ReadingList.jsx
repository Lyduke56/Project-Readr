import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./ReadingList.css"

export const ReadingList = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('TO_BE_READ');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data for books in different states
  const mockBooks = [
    {
      id: 1,
      title: "1984",
      author: "George Orwell",
      status: "COMPLETED",
      score: 9.5,
      dateAdded: "2024-01-15",
      pages: 328
    },
    {
      id: 2,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      status: "TO_BE_READ",
      score: null,
      dateAdded: "2024-02-10",
      pages: 180
    },
    {
      id: 3,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      status: "FAVORITES",
      score: 9.8,
      dateAdded: "2024-01-20",
      pages: 376
    },
    {
      id: 4,
      title: "The Metamorphosis",
      author: "Franz Kafka",
      status: "COMPLETED",
      score: 8.7,
      dateAdded: "2024-03-05",
      pages: 96
    },
    {
      id: 5,
      title: "Les Miserables",
      author: "Victor Hugo",
      status: "TO_BE_READ",
      score: null,
      dateAdded: "2024-02-25",
      pages: 1463
    },
    {
      id: 6,
      title: "Don Quixote",
      author: "Miguel de Cervantes",
      status: "FAVORITES",
      score: 9.2,
      dateAdded: "2024-01-10",
      pages: 1072
    },
    {
      id: 7,
      title: "The Prince",
      author: "Niccolò Machiavelli",
      status: "COMPLETED",
      score: 8.1,
      dateAdded: "2024-03-15",
      pages: 140
    },
    {
      id: 8,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      status: "TO_BE_READ",
      score: null,
      dateAdded: "2024-03-20",
      pages: 432
    },
    {
      id: 9,
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      status: "FAVORITES",
      score: 9.0,
      dateAdded: "2024-02-15",
      pages: 277
    },
    {
      id: 10,
      title: "Lord of the Flies",
      author: "William Golding",
      status: "COMPLETED",
      score: 8.5,
      dateAdded: "2024-03-10",
      pages: 224
    }
  ];

  // Simulate API call
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setBooks(mockBooks);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Filter books based on active filter and search query
  useEffect(() => {
    let filtered = books.filter(book => book.status === activeFilter);
    
    if (searchQuery) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredBooks(filtered);
  }, [books, activeFilter, searchQuery]);

  // Get counts for each category
  const getCounts = () => {
    const toBeReadCount = books.filter(book => book.status === 'TO_BE_READ').length;
    const completedCount = books.filter(book => book.status === 'COMPLETED').length;
    const favoritesCount = books.filter(book => book.status === 'FAVORITES').length;
    
    return { toBeReadCount, completedCount, favoritesCount };
  };

  const { toBeReadCount, completedCount, favoritesCount } = getCounts();

  const handleStatusChange = async (bookId, newStatus) => {
    // Update local state
    setBooks(prev => 
      prev.map(book => 
        book.id === bookId ? { ...book, status: newStatus } : book
      )
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const BookCard = ({ book }) => (
    <div className="reading-list-book-card">
      <div className="book-cover-section">
        <div className="book-cover-placeholder">
          <span className="cover-text">Book Cover</span>
        </div>
      </div>
      
      <div className="book-details">
        <div className="book-main-info">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">by {book.author}</p>
          <p className="book-pages">{book.pages} pages</p>
        </div>
        
        <div className="book-meta">
          <p className="date-added">Added: {new Date(book.dateAdded).toLocaleDateString()}</p>
          {book.score && (
            <div className="book-rating">
              <span className="rating-label">Your Rating: </span>
              <span className="rating-score">{book.score}/10</span>
            </div>
          )}
        </div>
        
        <div className="book-actions">
          <select 
            value={book.status}
            onChange={(e) => handleStatusChange(book.id, e.target.value)}
            className="status-select"
          >
            <option value="TO_BE_READ">To Be Read</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAVORITES">Favorites</option>
          </select>
          
          <button className="remove-button">Remove</button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your reading list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-list-page">
      {/* Navigation Section with Search */}
      <div className="navigation-section">
        <div className="container">
          <div className="navigation-content">

            <h1 className="page-title">My Reading List</h1>
           
            <div className="search-controls">
              <select className="filter-select">
                <option value="All">All</option>
                <option value="Books">Books</option>
                <option value="Authors">Authors</option>
              </select>
              
              <input
                type="text"
                placeholder="Search your reading list..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reading List Content */}
      <div className="reading-list-content">
        <div className="container">
          <div className="reading-list-header">
            
            
            {/* Filter Buttons */}
            <div className="filter-buttons">
              <button
                onClick={() => setActiveFilter('TO_BE_READ')}
                className={`filter-button ${activeFilter === 'TO_BE_READ' ? 'active' : ''}`}
              >
                TO BE READ <span className="count">({toBeReadCount})</span>
              </button>
              
              <button
                onClick={() => setActiveFilter('COMPLETED')}
                className={`filter-button ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
              >
                COMPLETED <span className="count">({completedCount})</span>
              </button>
              
              <button
                onClick={() => setActiveFilter('FAVORITES')}
                className={`filter-button ${activeFilter === 'FAVORITES' ? 'active' : ''}`}
              >
                FAVORITES <span className="count">({favoritesCount})</span>
              </button>
            </div>
          </div>

          {/* Books Grid */}
          <div className="books-grid">
            {filteredBooks.length > 0 ? (
              filteredBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))
            ) : (
              <div className="empty-state">
                <p className="empty-message">
                  {searchQuery 
                    ? `No books found matching "${searchQuery}" in ${activeFilter.toLowerCase().replace('_', ' ')}`
                    : `No books in ${activeFilter.toLowerCase().replace('_', ' ')} yet`
                  }
                </p>
                {!searchQuery && (
                  <button className="add-books-button">Add Books</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingList;


