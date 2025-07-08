import { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate, useViewTransitionState } from "react-router-dom"
import './Profile.css';
import { FaFacebook, FaInstagram, FaChevronLeft, FaChevronRight, FaUserFriends } from 'react-icons/fa';
import { ResetPass } from './ResetPass';
import { Modal } from '../Modal/Modal';
import { EditProfile } from './EditProfile';
import { StarRating } from '../components/StarRating';
import { FriendProfile } from './FriendProfile';


export function Profile() {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const user = session?.user;

  const [profileData, setProfileData] = useState(null);
  const [readingList, setReadingList] = useState([]);
  const [ratedBooks, setRatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingListLoading, setReadingListLoading] = useState(true);
  const [ratedBooksLoading, setRatedBooksLoading] = useState(true);
  
  const [isEditProfileOpened, setIsEditProfileOpened] = useState(false);
  const [isResetPasswordOpened, setIsResetPasswordOpened] = useState(false);
  const [error, setError] = useState('');

  // Store ratings for each book - using book key as the key
  const [bookRatings, setBookRatings] = useState({});
  
  // Carousel state for rated books
  const [currentRatedIndex, setCurrentRatedIndex] = useState(0);
  const [visibleRatedBooks, setVisibleRatedBooks] = useState(4); 

  const [totalFriends , setTotalFriends] = useState([]); 
  const [totalFriendsFromOther , setTotalFriendsFromOther] = useState([]); 

  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isFriendProfileOpen, setIsFriendProfileOpen] = useState(false);


  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setError('Failed to load profile data');
        } else {
          setProfileData(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Fetch user's reading list
  useEffect(() => {
    const fetchReadingList = async () => {
      if (!user?.id) {
        setReadingListLoading(false);
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
          setReadingList(data || []);
          // Fetch ratings for each book in the reading list
          if (data && data.length > 0) {
            data.forEach(book => {
              fetchBookRatings(book.book_key);
            });
          }
        }
      } catch (err) {
        console.error('Error fetching reading list:', err);
      } finally {
        setReadingListLoading(false);
      }
    };

    fetchReadingList();
  }, [user?.id]);

  // Add this useEffect to fetch friends data
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id) {
        setFriendsLoading(false);
        return;
      }

    try {
      // Method 1: Fetch friendships first, then get user details separately
      
      // Get all friendships where current user is involved
      const { data: friendships, error: friendshipsError } = await supabase
        .from('accepted_friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (friendshipsError) {
        console.error('Error fetching friendships:', friendshipsError);
        setFriends([]);
        return;
      }

      console.log('📋 Raw friendships data:', friendships);

      if (!friendships || friendships.length === 0) {
        console.log('🚫 No friendships found');
        setFriends([]);
        return;
      }

      // Extract friend IDs
      const friendIds = friendships.map(friendship => {
        // If current user is the user_id, then friend is friend_id
        // If current user is the friend_id, then friend is user_id
        return friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
      });

      console.log('🔍 Friend IDs:', friendIds);

      // Fetch user details for all friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('users')
        .select('id, display_name, full_name, email, profile_image, bio, location')
        .in('id', friendIds);

      if (friendsError) {
        console.error('Error fetching friends data:', friendsError);
        setFriends([]);
        return;
      }

      console.log('👥 Friends data:', friendsData);

      // Combine friendship info with user data
      const friendsWithDates = friendsData.map(friend => {
        const friendship = friendships.find(f => 
          f.user_id === friend.id || f.friend_id === friend.id
        );
        return {
          ...friend,
          friendship_date: friendship?.created_at
        };
      });

      console.log('✅ Final friends with dates:', friendsWithDates);
      setFriends(friendsWithDates);

    } catch (err) {
      console.error('💥 Error in fetchFriends:', err);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  fetchFriends();
}, [user?.id]);

  // Fetch user's rated books
  useEffect(() => {
    const fetchRatedBooks = async () => {
      if (!user?.id) {
        setRatedBooksLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('book_ratings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching rated books:', error);
        } else {
          setRatedBooks(data || []);
        }
      } catch (err) {
        console.error('Error fetching rated books:', err);
      } finally {
        setRatedBooksLoading(false);
      }
    };

    fetchRatedBooks();
  }, [user?.id]);

  const handleFriendClick = async (friend, event) => {
    // Check if the click was on the unfriend button
    if (event.target.classList.contains('unfriend-btn') || event.target.closest('.unfriend-btn')) {
      event.stopPropagation();
      
      const confirmed = window.confirm(`Are you sure you want to unfriend ${friend.display_name || friend.full_name}?`);
      if (!confirmed) return;
      
      try {
        // Remove friendship from both directions
        const { error1 } = await supabase
          .from('accepted_friendships')
          .delete()
          .or(`and(user_id.eq.${user.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${user.id})`);
        
        if (error1) {
          console.error('Error removing friendship:', error1);
          alert('Failed to remove friend');
          return;
        }
        
        // Update local state
        setFriends(prev => prev.filter(f => f.id !== friend.id));
        setTotalFriends(prev => prev.filter(f => f.friend_id !== friend.id));
        setTotalFriendsFromOther(prev => prev.filter(f => f.user_id !== friend.id));
        
        alert('Friend removed successfully');
      } catch (error) {
        console.error('Error unfriending:', error);
        alert('An error occurred while removing friend');
      }
    } else {
      // Normal click - open profile
      setSelectedFriend(friend);
      setIsFriendProfileOpen(true);
    }
  };

  const handleCloseFriendProfile = () => {
    setIsFriendProfileOpen(false);
    setSelectedFriend(null);
  };

  useEffect (() => {
    const fetchTotalFriends = async () => {
      if (!user?.id) {
              console.error('No user has been found!');
              return;
            }
            try {
              const { data, error } = await supabase
                .from('accepted_friendships')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching rated books:', error);
              } else {
                setTotalFriends(data || []);
              }
            } catch (err) {
              console.error('Error fetching rated books:', err);
            }

          }
    fetchTotalFriends()
    const interval = setInterval(fetchTotalFriends, 4000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect (() => {
    const fetchTotalFriendsFromOther = async () => {
      if (!user?.id) {
              console.error('No user has been found!');
              return;
            }
            try {
              const { data, error } = await supabase
                .from('accepted_friendships')
                .select('*')
                .eq('friend_id', user.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching rated books:', error);
              } else {
                setTotalFriendsFromOther(data || []);
              }
            } catch (err) {
              console.error('Error fetching rated books:', err);
            }
          }
   fetchTotalFriendsFromOther()
  }, [user?.id]);


  // Handle window resize for responsive carousel
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setVisibleRatedBooks(1);
      } else if (window.innerWidth <= 1024) {
        setVisibleRatedBooks(2);
      } else if (window.innerWidth <= 1200) {
        setVisibleRatedBooks(3);
      } else {
        setVisibleRatedBooks(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const fetchBookRatings = async (bookId) => {
    try {
      // Fetch overall rating statistics
      const { data: ratingStats, error: statsError } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('book_id', bookId);

      if (statsError) {
        console.error('Error fetching rating stats:', statsError);
        return;
      }

      if (ratingStats && ratingStats.length > 0) {
        const totalRatings = ratingStats.length;
        const averageRating = ratingStats.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;
        
        // Store the rating data for this specific book
        setBookRatings(prev => ({
          ...prev,
          [bookId]: {
            overallRating: parseFloat(averageRating.toFixed(1)),
            totalRatings: totalRatings
          }
        }));
      } else {
        // No ratings yet
        setBookRatings(prev => ({
          ...prev,
          [bookId]: {
            overallRating: 0,
            totalRatings: 0
          }
        }));
      }
    } catch (error) {
      console.error('Error in fetchBookRatings:', error);
    }
  };

  // Remove book from reading list
  const removeFromReadingList = async (bookKey) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('reading_list')
        .delete()
        .eq('user_id', user.id)
        .eq('book_key', bookKey);

      if (error) {
        console.error('Error removing book:', error);
        alert('Failed to remove book from reading list');
      } else {
        // Update local state
        setReadingList(prev => prev.filter(book => book.book_key !== bookKey));
        
        // Remove rating data for this book
        setBookRatings(prev => {
          const newRatings = { ...prev };
          delete newRatings[bookKey];
          return newRatings;
        });
        
        // Also remove from localStorage
        const localReadingList = JSON.parse(localStorage.getItem('readingList') || '[]');
        const updatedLocalList = localReadingList.filter(book => book.key !== bookKey);
        localStorage.setItem('readingList', JSON.stringify(updatedLocalList));
        
        alert('Book removed from reading list');
      }
    } catch (err) {
      console.error('Error removing book:', err);
      alert('An error occurred while removing the book');
    }
  };

  // Handle book click - navigate to book details
const handleBookClick = (book) => {
  let bookData;
  
  // Check if this is a rated book (has book_id) or reading list book (has book_key)
  if (book.book_id) {
    // This is from the rated books (book_ratings table)
    bookData = {
      key: book.book_id,
      title: book.book_title,
      author_name: book.book_author ? [book.book_author] : ['Unknown Author'],
      cover_i: book.cover_id,
      first_publish_year: book.publish_year,
      edition_count: book.edition_count
    };
  } else {
    // This is from reading list - keep your existing logic
    bookData = {
      key: book.book_key || book.book_id,
      title: book.title || book.book_title,
      author_name: book.author ? [book.author] : (book.book_author ? [book.book_author] : ['Unknown Author']),
      cover_i: book.cover_id,
      first_publish_year: book.publish_year,
      edition_count: book.edition_count
    };
  }
  
  localStorage.setItem('selectedBook', JSON.stringify(bookData));
  navigate('/Book');
};

  // Carousel navigation functions
  const handlePrevRated = () => {
    setCurrentRatedIndex(prev => 
      prev === 0 ? Math.max(0, ratedBooks.length - visibleRatedBooks) : prev - 1
    );
  };

  const handleNextRated = () => {
    setCurrentRatedIndex(prev => 
      prev >= ratedBooks.length - visibleRatedBooks ? 0 : prev + 1
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatGender = (gender) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).replaceAll('_', ' ');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleFriendList = () => {
    console.log("succeeded friend list");
      navigate('/FriendsList');
  };

  //Edit profile function   
  const handleEditProfile = (e) => {
    e.preventDefault();
    setIsEditProfileOpened(true);
  };

  //Reset password function 
  const handleResetPassword = (e) => {
    e.preventDefault();
    setIsResetPasswordOpened(true);
  };


  // Helper function to truncate text
  const truncateText = (text, maxLength = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Rated Books Carousel Component
  const RatedBooksCarousel = () => {
    if (ratedBooksLoading) {
      return (
        <div className="profile-section">
          <h3>My Rated Books</h3>
          <div className="carousel-loading">
            <div className="loading-spinner"></div>
            <p>Loading your rated books...</p>
          </div>
        </div>
      );
    }

    if (ratedBooks.length === 0) {
      return (
        <div className="profile-section">
          <h3>My Rated Books</h3>
          <div className="empty-rated-books">
            <p>⭐ You haven't rated any books yet</p>
            <p>Start rating books to see them here!</p>
          </div>
        </div>
      );
    }

    const canShowPrev = currentRatedIndex > 0;
    const canShowNext = currentRatedIndex < ratedBooks.length - visibleRatedBooks;

    return (
      <div className="profile-section">
        <div className="section-header">
          <h3>My Rated Books ({ratedBooks.length})</h3>
          <div className="carousel-controls">
            <button 
              className={`carousel-btn prev ${!canShowPrev ? 'disabled' : ''}`}
              onClick={handlePrevRated}
              disabled={!canShowPrev}
            >
              <FaChevronLeft />
            </button>
            <button 
              className={`carousel-btn next ${!canShowNext ? 'disabled' : ''}`}
              onClick={handleNextRated}
              disabled={!canShowNext}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        
        <div className="rated-books-carousel">
          <div 
            className="carousel-container"
            style={{
              transform: `translateX(-${currentRatedIndex * (100 / visibleRatedBooks)}%)`,
              transition: 'transform 0.3s ease'
            }}
          >
            {ratedBooks.map((ratedBook) => (
              <div key={ratedBook.id} className="rated-book-card">
                <div className="book-cover" onClick={() => handleBookClick(ratedBook)}>
                  {ratedBook.cover_id ? (
                    <>
                      <img 
                        src={`https://covers.openlibrary.org/b/id/${ratedBook.cover_id}-M.jpg`}
                        alt={`Cover of ${ratedBook.book_title}`} 
                        className="book-cover-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="book-cover-placeholder" style={{display: 'none'}}>
                        <span>📖</span>
                      </div>
                    </>
                  ) : (
                    <div className="book-cover-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                </div>
                
                <div className="book-info">
                  <div className="book-content" onClick={() => handleBookClick(ratedBook)}>
                    <h4 className="book-title" title={ratedBook.book_title}>
                      {truncateText(ratedBook.book_title, 30)}
                    </h4>
                    <p className="book-author" title={ratedBook.book_author}>
                      by {truncateText(ratedBook.book_author, 25)}
                    </p>
                    
                    <div className="user-rating">
                      <h5>My Rating</h5>
                      <div className="rating-display">
                        <StarRating 
                          rating={ratedBook.rating} 
                          readonly={true}
                          size={18}
                        />
                        <span className="rating-text">{ratedBook.rating}/5</span>
                      </div>
                    </div>
                    
                    <p className="rating-date">
                      Rated {formatDate(ratedBook.created_at)}
                    </p>
                    
                    {ratedBook.review && (
                      <p className="book-review" title={ratedBook.review}>
                        "{truncateText(ratedBook.review, 60)}"
                      </p>
                    )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add this Friends List Component (place it with your other components)
const FriendsListSection = () => {
  console.log('🎯 FriendsListSection render:', { 
    friendsLoading, 
    friendsLength: friends.length, 
    friends 
  }); // DEBUG

  if (friendsLoading) {
    return (
      <div className="profile-section">
        <h3>Friends</h3>
        <div className="friends-loading">
          <div className="loading-spinner"></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    console.log('🚫 No friends to display'); // DEBUG
    return (
      <div className="profile-section">
        <h3>Friends</h3>
        <div className="empty-friends-list">
          <div className="empty-icon">👥</div>
          <h4>No friends yet</h4>
          <p>Start making connections with other readers!</p>
        </div>
      </div>
    );
  }

  const displayedFriends = showAllFriends ? friends : friends.slice(0, 6);
  const hasMoreFriends = friends.length > 6;

  console.log('🎨 Displaying friends:', { 
    displayedFriends, 
    hasMoreFriends, 
    showAllFriends 
  }); // DEBUG

  return (
    <div className="profile-section">
      <div className="section-header">
        <h3>Friends ({friends.length})</h3>
        {hasMoreFriends && (
          <button 
            className="see-more-btn"
            onClick={() => setShowAllFriends(!showAllFriends)}
          >
            {showAllFriends ? 'Show Less' : 'See More'}
          </button>
        )}
      </div>
      
      <div className="friends-grid">
        {displayedFriends.map((friend) => (
          <div 
            key={friend.id} 
            className="friend-card"
            onClick={(e) => handleFriendClick(friend, e)}
          >
            <div className="friend-avatar">
              {friend.profile_image ? (
                <img 
                  src={friend.profile_image} 
                  alt={`${friend.display_name || friend.full_name}'s avatar`}
                  className="friend-avatar-image"
                />
              ) : (
                <div className="friend-avatar-placeholder">
                  {(friend.display_name || friend.full_name || friend.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="friend-info">
              <h4 className="friend-name">
                {friend.display_name || friend.full_name || 'Anonymous Reader'}
              </h4>
              {friend.location && (
                <p className="friend-location">📍 {friend.location}</p>
              )}
              {friend.bio && (
                <p className="friend-bio" title={friend.bio}>
                  {friend.bio.length > 20 ? `${friend.bio.substring(0, 20)}...` : friend.bio}

                </p>
              )}
              <p className="friendship-date">
                Friends since {formatDate(friend.friendship_date)}
              </p>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

  // Reading List Component with improved UI
  const ReadingListSection = () => {
    if (readingListLoading) {
      return (
        <div className="profile-section">
          <h3>My Reading List</h3>
          <div className="reading-list-loading">
            <div className="loading-spinner"></div>
            <p>Loading your reading list...</p>
          </div>
        </div>
      );
    }

    if (readingList.length === 0) {
      return (
        <div className="profile-section">
          <h3>My Reading List</h3>
          <div className="empty-reading-list">
            <div className="empty-icon">📚</div>
            <h4>Your reading list is empty</h4>
            <p>Start exploring books and add them to your list!</p>
            <Link to="/" className="browse-books-btn">
              Browse Books
            </Link>
          </div>
        </div>
      );
    }

      return (
      <div className="profile-section">
        <h3>My Reading List ({readingList.length})</h3>
        <div className="reading-list-grid">
          {readingList.map((book) => {
            // Get the rating data for this specific book
            const ratingData = bookRatings[book.book_key] || { overallRating: 0, totalRatings: 0 };
            
            // Updated JSX for the reading list book card
            return (
              <div key={book.id} className="reading-list-book-card " onClick={() => handleBookClick(book)}>
                <div className="book-cover">
                  {book.cover_id ? (
                    <>
                      <img 
                        src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                        alt={`Cover of ${book.title}`} 
                        className="book-cover-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="book-cover-placeholder" style={{display: 'none'}}>
                        <span>📖</span>
                      </div>
                    </>
                  ) : (
                    <div className="book-cover-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                </div>
                
                <div className="book-info">
                  <div className="book-content">
                    <h4 className="book-title" title={book.title} style={{ fontSize: truncateText(book.title, 30).length > 40 ? '14px' : '16px' }}>
                      {truncateText(book.title, 22)}
                    </h4>
                    
                    <p className="book-author" title={book.author}>
                      by {truncateText(book.author, 22)}
                    </p>
                    
                    {book.publish_year && (
                      <p className="book-year">({book.publish_year})</p>
                    )}
                    
                    <div className="overall-rating">
                      <div className="rating-display">
                        <StarRating 
                          rating={ratingData.overallRating} 
                          readonly={true}
                          size={16}
                        />
                        <span className="rating-text">
                          {ratingData.overallRating > 0 ? `${ratingData.overallRating}/5` : 'No ratings'} 
                          {ratingData.totalRatings > 0 && ` (${ratingData.totalRatings})`}
                        </span>
                      </div>
                    </div>
                    
                    <p className="book-added-date">
                      Added {formatDate(book.added_at)}
                    </p>
                  </div>
                  
                  <div className="book-actions">
                    <button 
                      className="view-book-btn"
                      onClick={() => handleBookClick(book)}
                    >
                      View Details
                    </button>
                    <button 
                      className="remove-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to remove this book from your reading list?')) {
                          removeFromReadingList(book.book_key);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-container">
        <div className="no-profile">
          <h2>No Profile Found</h2>
          <p>It looks like you haven't completed your profile setup yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profileData.profile_image ? (
            <img 
              src={profileData.profile_image} 
              alt={`${profileData.display_name || profileData.full_name}'s avatar`}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {(profileData.display_name || profileData.full_name || profileData.email)
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="profile-names">
          <div className="in-line-display">
            <h1 className="display-name">
              {profileData.display_name || profileData.full_name || 'Anonymous Reader'}
            </h1>
            <div className="profile-status">
              {profileData.is_private ? (
                <span className="status-badge private">🔒 Private Profile</span>
              ) : (
                <span className="status-badge public">🌐 Public Profile</span>
              )}
            </div>
          </div>
           
          {profileData.display_name && profileData.full_name && (
            <h2 className="full-name">{profileData.full_name}</h2>
          )}
          
          <div className="friends" onClick={handleFriendList}> 
            <FaUserFriends />
             { (totalFriends?.length || 0) + (totalFriendsFromOther?.length || 0) } Friends
          </div>

        </div>

        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={handleEditProfile}>
            Edit Profile
          </button>

          <button className="reset-password-btn" onClick={handleResetPassword}>
            Reset Password
          </button>
          
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>  
      </div>

      {/* Modal part */}
      {isEditProfileOpened && (
        <Modal isOpened={isEditProfileOpened} onClose={() => setIsEditProfileOpened(false)}>
          <EditProfile />
        </Modal>
      )}

      {isResetPasswordOpened && (
        <Modal isOpened={isResetPasswordOpened} onClose={() => setIsResetPasswordOpened(false)}>
          <ResetPass hideCancel={true} onProfile={true} />
        </Modal>
      )}
                
      <div className="profile-content">
        {profileData.bio && (
          <div className="profile-section">
            <h3>About</h3>
            <p className="bio-text">{profileData.bio}</p>
          </div>
        )}
  
        <FriendsListSection />

        {isFriendProfileOpen && selectedFriend && (
          <Modal isOpened={isFriendProfileOpen} onClose={handleCloseFriendProfile}>
            <FriendProfile 
              friend={selectedFriend} 
              onUnfriend={(friendId) => {
                setFriends(prev => prev.filter(f => f.id !== friendId));
                setTotalFriends(prev => prev.filter(f => f.friend_id !== friendId));
                setTotalFriendsFromOther(prev => prev.filter(f => f.user_id !== friendId));
              }}
              onClose={handleCloseFriendProfile}
            />
          </Modal>
        )}

        <div className="profile-details">
          <div className="profile-section">
            <h3>Contact Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{profileData.email}</span>
              </div>
              
              {profileData.location && (
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">📍 {profileData.location}</span>
                </div>
              )}
              
              {(profileData.facebook_url || profileData.instagram_url || profileData.x_url) && (
                <div className="detail-item">
                  <span className="detail-label">Website/s:</span>
                  <div className="websites">
                    {profileData.facebook_url && (
                      <a href={profileData.facebook_url} target="_blank" rel="noopener noreferrer">
                        <FaFacebook size={35} color="black" />
                      </a>
                    )}

                    {profileData.instagram_url && (
                      <a href={profileData.instagram_url} target="_blank" rel="noopener noreferrer">
                        <FaInstagram size={35} color="black" />
                      </a>
                    )}

                    {profileData.x_url && (
                      <a href={profileData.x_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src="./x.svg"
                          alt="X"
                          width={35}
                          height={35}
                          className="black-logo"
                        />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h3>Personal Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{formatGender(profileData.gender)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Birth Date:</span>
                <span className="detail-value">{formatDate(profileData.birth_date)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Member Since:</span>
                <span className="detail-value">{formatDate(profileData.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rated Books Carousel */}
        <RatedBooksCarousel />

        {/* Reading List Section */}
        <ReadingListSection />

        <div className="profile-stats">
          <div className="stat-card">
            <h4>Reading Stats</h4>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-value">{readingList.length}</span>
                <span className="stat-label">Books in Reading List</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{ratedBooks.length}</span>
                <span className="stat-label">Books Rated</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <h4>Favorite Genres</h4>
            <p>Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
