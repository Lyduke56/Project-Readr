import { useState, useEffect } from 'react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { StarRating } from '../components/StarRating';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './FriendProfile.css';

export function FriendProfile({ friend, onUnfriend, onClose }) {
  const [ratedBooks, setRatedBooks] = useState([]);
  const [ratedBooksLoading, setRatedBooksLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);

  // Fetch friend's rated books
  useEffect(() => {
    const fetchRatedBooks = async () => {
      if (!friend?.id) {
        setRatedBooksLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('book_ratings')
          .select('*')
          .eq('user_id', friend.id)
          .order('created_at', { ascending: false })
          .limit(6); // Limit to 6 recent books

        if (error) {
          console.error('Error fetching friend rated books:', error);
        } else {
          setRatedBooks(data || []);
        }
      } catch (err) {
        console.error('Error fetching friend rated books:', err);
      } finally {
        setRatedBooksLoading(false);
      }
    };

    fetchRatedBooks();
  }, [friend?.id]);

  // Fetch friend's total friends count
  useEffect(() => {
    const fetchFriendsCount = async () => {
      if (!friend?.id) return;

      try {
        const [friendsAsUser, friendsAsFriend] = await Promise.all([
          supabase
            .from('accepted_friendships')
            .select('id')
            .eq('user_id', friend.id),
          supabase
            .from('accepted_friendships')
            .select('id')
            .eq('friend_id', friend.id)
        ]);

        const totalFriends = (friendsAsUser.data?.length || 0) + (friendsAsFriend.data?.length || 0);
        setFriendsCount(totalFriends);
      } catch (err) {
        console.error('Error fetching friends count:', err);
      }
    };

    fetchFriendsCount();
  }, [friend?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const { session } = UserAuth();
const user = session?.user;

const handleUnfriend = async () => {
  const confirmed = window.confirm(`Are you sure you want to unfriend ${friend.display_name || friend.full_name}?`);
  if (!confirmed) return;
  
  try {
    const { error } = await supabase
      .from('accepted_friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${user.id})`);
    
    if (error) {
      console.error('Error removing friendship:', error);
      alert('Failed to remove friend');
      return;
    }
    
    alert('Friend removed successfully');
    onUnfriend(friend.id); // Call the callback to update parent state
    onClose(); // Close the modal
  } catch (error) {
    console.error('Error unfriending:', error);
    alert('An error occurred while removing friend');
  }
};

  const formatGender = (gender) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).replaceAll('_', ' ');
  };

  const truncateText = (text, maxLength = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="friend-profile-inmodal">
      <div className="profile-header-inmodal">
        <div className="profile-avatar-inmodal">
          {friend.profile_image ? (
            <img 
              src={friend.profile_image} 
              alt={`${friend.display_name || friend.full_name}'s avatar`}
              className="avatar-image-inmodal"
            />
          ) : (
            <div className="avatar-placeholder-inmodal">
              {(friend.display_name || friend.full_name || friend.email)
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="profile-names-inmodal">
          <div className="in-line-display-inmodal">
            <h1 className="display-name-inmodal">
              {friend.display_name || friend.full_name || 'Anonymous Reader'}
            </h1>
            <div className="profile-status-inmodal">
              {friend.is_private ? (
                <span className="status-badge private-inmodal">🔒 Private Profile</span>
              ) : (
                <span className="status-badge public-inmodal">🌐 Public Profile</span>
              )}
            </div>
          </div>

          <div className="profile-actions-inmodal">
            <button className="unfriend-btn" onClick={handleUnfriend}>
              Remove Friend
            </button>
          </div>
           
          {friend.display_name && friend.full_name && (
            <h2 className="full-name-inmodal">{friend.full_name}</h2>
          )}
          
          <div className="friends-count-inmodal">
            <span>👥 {friendsCount} Friends</span>
          </div>
        </div>
      </div>

      <div className="profile-content-inmodal">
        {friend.bio && (
          <div className="profile-section-inmodal">
            <h3>About</h3>
            <p className="bio-text-inmodal">{friend.bio}</p>
          </div>
        )}

        <div className="profile-details-inmodal">
          <div className="profile-section-inmodal">
            <h3>Contact Information</h3>
            <div className="detail-grid-inmodal">
              <div className="detail-item-inmodal">
                <span className="detail-label-inmodal">Email:</span>
                <span className="detail-value-inmodal">{friend.email}</span>
              </div>
              
              {friend.location && (
                <div className="detail-item-inmodal">
                  <span className="detail-label-inmodal">Location:</span>
                  <span className="detail-value-inmodal">📍 {friend.location}</span>
                </div>
              )}
              
              {(friend.facebook_url || friend.instagram_url || friend.x_url) && (
                <div className="detail-item-inmodal">
                  <span className="detail-label-inmodal">Website/s:</span>
                  <div className="websites-inmodal">
                    {friend.facebook_url && (
                      <a href={friend.facebook_url} target="_blank" rel="noopener noreferrer">
                        <FaFacebook size={35} color="black" />
                      </a>
                    )}

                    {friend.instagram_url && (
                      <a href={friend.instagram_url} target="_blank" rel="noopener noreferrer">
                        <FaInstagram size={35} color="black" />
                      </a>
                    )}

                    {friend.x_url && (
                      <a href={friend.x_url} target="_blank" rel="noopener noreferrer">
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

          <div className="profile-section-inmodal">
            <h3>Personal Information</h3>
            <div className="detail-grid-inmodal">
              <div className="detail-item-inmodal">
                <span className="detail-label-inmodal">Gender:</span>
                <span className="detail-value-inmodal">{formatGender(friend.gender)}</span>
              </div>
              
              <div className="detail-item-inmodal">
                <span className="detail-label-inmodal">Birth Date:</span>
                <span className="detail-value-inmodal">{formatDate(friend.birth_date)}</span>
              </div>
              
              <div className="detail-item-inmodal">
                <span className="detail-label-inmodal">Member Since:</span>
                <span className="detail-value-inmodal">{formatDate(friend.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Friend's Rated Books */}
        <div className="profile-section-inmodal">
          <h3>Recent Rated Books</h3>
          {ratedBooksLoading ? (
            <div className="carousel-loading-inmodal">
              <div className="loading-spinner-inmodal"></div>
              <p>Loading rated books...</p>
            </div>
          ) : ratedBooks.length === 0 ? (
            <div className="empty-rated-books-inmodal">
              <p>⭐ No rated books yet</p>
            </div>
          ) : (
            <div className="friend-rated-books-grid-inmodal">
              {ratedBooks.map((ratedBook) => (
                <div key={ratedBook.id} className="rated-book-card-inmodal">
                  <div className="book-cover-inmodal">
                    {ratedBook.cover_id ? (
                      <>
                        <img 
                          src={`https://covers.openlibrary.org/b/id/${ratedBook.cover_id}-M.jpg`}
                          alt={`Cover of ${ratedBook.book_title}`} 
                          className="book-cover-image-inmodal"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="book-cover-placeholder-inmodal" style={{display: 'none'}}>
                          <span>📖</span>
                        </div>
                      </>
                    ) : (
                      <div className="book-cover-placeholder-inmodal">
                        <span>📖</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="book-info-inmodal">
                    <h4 className="book-title-inmodal" title={ratedBook.book_title}>
                      {truncateText(ratedBook.book_title, 30)}
                    </h4>
                    <p className="book-author-inmodal" title={ratedBook.book_author}>
                      by {truncateText(ratedBook.book_author, 25)}
                    </p>
                    
                    <div className="user-rating-inmodal">
                      <div className="rating-display-inmodal">
                        <StarRating 
                          rating={ratedBook.rating} 
                          readonly={true}
                          size={16}
                        />
                        <span className="rating-text-inmodal">{ratedBook.rating}/5</span>
                      </div>
                    </div>
                    
                    <p className="rating-date-inmodal">
                      Rated {formatDate(ratedBook.created_at)}
                    </p>
                    
                    {ratedBook.review && (
                      <p className="book-review-inmodal" title={ratedBook.review}>
                        "{truncateText(ratedBook.review, 60)}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-stats-inmodal">
          <div className="stat-card-inmodal">
            <h4>Reading Stats</h4>
            <div className="stat-grid-inmodal">
              <div className="stat-item-inmodal">
                <span className="stat-value-inmodal">{ratedBooks.length}</span>
                <span className="stat-label-inmodal">Books Rated</span>
              </div>
              <div className="stat-item-inmodal">
                <span className="stat-value-inmodal">{friendsCount}</span>
                <span className="stat-label-inmodal">Friends</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}