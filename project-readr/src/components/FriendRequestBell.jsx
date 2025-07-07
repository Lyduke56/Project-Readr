import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaUserCheck, FaUserTimes, FaUser } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import './FriendRequestBell.css';

export function FriendRequestBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [session, setSession] = useState(null);
  const dropdownRef = useRef(null);

  // Get current user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setCurrentUserId(session?.user?.id);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUserId(session?.user?.id);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch friend requests (also with 6-second interval)
  useEffect(() => {
    if (!currentUserId) return;

    const fetchFriendRequests = async () => {
      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from('friendships')
          .select(`
            id,
            user_id,
            created_at,
            users!friendships_user_id_fkey (
              id,
              display_name,
              profile_image,
              email
            )
          `)
          .eq('friend_id', currentUserId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.error('Error fetching friend requests:', requestsError);
        } else {
          setFriendRequests(requestsData || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    fetchFriendRequests(); 

    const interval = setInterval(fetchFriendRequests, 4000); 

    return () => clearInterval(interval); 
  }, [currentUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const notifySender = async (recipientId, message) => {
    try {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        message,
        created_at: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const sendNotification = async (toUserId, message) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        { user_id: toUserId, message }
      ]);

    if (error) console.error('Error sending notification:', error);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

const handleAcceptRequest = async (requestId, userId) => {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('Error accepting friend request:', error);
    } else {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      await sendNotification(userId, 'Your friend request has been accepted!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

const handleRejectRequest = async (requestId, userId) => {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting friend request:', error);
    } else {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      await sendNotification(userId, 'Your friend request has been rejected.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - requestTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return requestTime.toLocaleDateString();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="friend-request-bell" ref={dropdownRef}>
      <button
        className={`bell-button ${friendRequests.length > 0 ? 'has-notifications' : ''}`}
        onClick={toggleDropdown}
        aria-label="Friend requests"
      >
        <FaBell />
        {friendRequests.length > 0 && (
          <span className="notification-badge">{friendRequests.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <h3>Friend Requests</h3>
            {friendRequests.length > 0 && (
              <span className="request-count">{friendRequests.length}</span>
            )}
          </div>

          <div className="dropdown-content">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading requests...</p>
              </div>
            ) : friendRequests.length === 0 ? (
              <div className="empty-state">
                <FaBell className="empty-icon" />
                <p>No friend requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {friendRequests.map(request => (
                  <div key={request.id} className="request-item">
                    <div className="request-avatar">
                      {request.users?.profile_image ? (
                        <img
                          src={request.users.profile_image}
                          alt={request.users.display_name}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          <FaUser />
                        </div>
                      )}
                    </div>

                    <div className="request-info">
                      <div className="request-header">
                        <h4>{request.users?.display_name || 'Unknown User'}</h4>
                        <span className="request-time">
                          {formatTimeAgo(request.created_at)}
                        </span>
                      </div>
                      <p className="request-message">wants to be your friend</p>

                      <div className="request-actions">
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptRequest(request.id, request.user_id)}
                        >
                          <FaUserCheck /> Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRejectRequest(request.id, request.user_id)}
                        >
                          <FaUserTimes /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
