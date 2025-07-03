import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom" // Add this import
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import "./ReadingList.css"

export const ReadingList = () => {
  const { session, signOut } = UserAuth();
  const user = session?.user;
  const navigate = useNavigate(); // Add this hook

  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('TO_BE_READ');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  

  // Mock data for books in different states
  useEffect(() => {
      const fetchReadingList = async () => {
        if (!user?.id) {
          setLoading(false);
          return;
        }
  
        try {
          const { data, error } = await supabase
            .from('reading_list')
            .select('*')
            .eq('user_id', user.id)
            .order('added_at', { ascending: false });
  
          if (error) {
            console.error('Error fetching reading list:', error);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setBooks(data || []);
          }
        } catch (err) {
          console.error('Error fetching reading list:', err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchReadingList();
    }, [user?.id]);


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

  // Add this function to handle book card clicks
  const handleBookCardClick = (book) => {
    // Convert your reading list book data to the format expected by the Book page
    const bookData = {
      key: book.book_key,
      title: book.title,
      author_name: [book.author], // Convert to array format like OpenLibrary API
      cover_i: book.cover_id,
      first_publish_year: book.publish_year,
      isbn: book.isbn ? [book.isbn] : undefined,
      subject: book.subject ? book.subject.split(", ") : undefined
    };

    // Store book data for the Book page (same as in Home component)
    localStorage.setItem('selectedBook', JSON.stringify(bookData));
    
    // Navigate to Book page
    navigate('/Book');
  };

  // Helper function to get title class based on length
  const getTitleClass = (title) => {
      if (!title) return 'rlbook-title';
      const length = title.length;
      if (length > 45) return 'rlbook-title very-long-title';
      if (length > 30) return 'rlbook-title long-title';
      return 'rlbook-title';
    };

    // Helper function to get author class based on length
    const getAuthorClass = (author) => {
      if (!author) return 'rlbook-author';
      const length = author.length;
      if (length > 40) return 'rlbook-author very-long-author';
      if (length > 20) return 'rlbook-author long-author';
      return 'rlbook-author';
    };

  const BookCard = ({ book }) => (
    <div 
      className="reading-list-book-card"
      onClick={() => handleBookCardClick(book)} // Add click handler
      style={{ cursor: 'pointer' }} // Add pointer cursor to indicate clickability
    >
      <div className="book-cover-section">
        <div className="book-cover-placeholder">
          <span className="cover-text"><img className="rlbook-image" src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`} /></span>
        </div>
      </div>
      
      <div className="book-details">
        <div className="book-main-info">
          <h3 className={getTitleClass(book.title)}>{book.title}</h3>
          <p className={getAuthorClass(book.author)}>by {book.author}</p>
        </div>
        
        <div className="book-meta">
          <p className="date-added">Added: {new Date(book.added_at).toLocaleDateString()}</p>
          {book.score && (
            <div className="book-rating">
              <span className="rating-label">Your Rating: </span>
              <span className="rating-score">{book.score}/10</span>
            </div>
          )}
        </div>
        
        <div className="rlbook-actions">
          <select 
            value={book.status}
            onChange={(e) => {
              e.stopPropagation(); // Prevent card click when changing status
              handleStatusChange(book.id, e.target.value);
            }}
            className="status-select"
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking select
          >
            <option value="TO_BE_READ">To Be Read</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAVORITES">Favorites</option>
          </select>
          
          <button 
            className="remove-button"
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking remove
          >
            Remove
          </button>
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
                TO BE read <span className="count">({toBeReadCount})</span>
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
          <div className="rlbooks-grid">
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