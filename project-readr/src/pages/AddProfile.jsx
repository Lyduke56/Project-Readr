import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaUserCheck, FaUser, FaClock, FaUserTimes } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import './AddProfile.css';

export function AddProfile() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState(new Set()); // Requests friend request user have/has? sent
  const [incomingRequests, setIncomingRequests] = useState(new Set()); // Requests recieved
  const [currentUserId, setCurrentUserId] = useState(null);
  const [session, setSession] = useState(null);

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

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, display_name, profile_image, email, bio');
        
        if (error) {
          console.error('Error fetching users:', error);
        } else {
          setUsers(data || []);
          setFilteredUsers(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  // Fetch friend relationships and requests
  useEffect(() => {
    const fetchRelationships = async () => {
      if (!currentUserId) return;
      
      try {
        // Fetch confirmed friendships (both directions)
        const { data: friendshipsData, error: friendshipsError } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
          .eq('status', 'accepted');
        
        if (friendshipsError) {
          console.error('Error fetching friendships:', friendshipsError);
        } else {
          const friendIds = friendshipsData.map(friendship => 
            friendship.user_id === currentUserId ? friendship.friend_id : friendship.user_id
          );
          setFriends(new Set(friendIds));
        }

        // Fetch pending friend requests I sent
        const { data: sentRequestsData, error: sentRequestsError } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', currentUserId)
          .eq('status', 'pending');
        
        if (sentRequestsError) {
          console.error('Error fetching sent requests:', sentRequestsError);
        } else {
          const pendingIds = sentRequestsData.map(request => request.friend_id);
          setPendingRequests(new Set(pendingIds));
        }

        // Fetch incoming friend requests
        const { data: incomingRequestsData, error: incomingRequestsError } = await supabase
          .from('friendships')
          .select('user_id')
          .eq('friend_id', currentUserId)
          .eq('status', 'pending');
        
        if (incomingRequestsError) {
          console.error('Error fetching incoming requests:', incomingRequestsError);
        } else {
          const incomingIds = incomingRequestsData.map(request => request.user_id);
          setIncomingRequests(new Set(incomingIds));
        }

      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    fetchRelationships();
  }, [currentUserId]);

  useEffect(() => {
    let filtered = users;
    
    // Filter out current user and existing friends
    filtered = filtered.filter(user => 
      user.id !== currentUserId && !friends.has(user.id)
    );
    
    //search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, currentUserId, friends]);

  const handleSendFriendRequest = async (userId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert([{ 
          user_id: currentUserId, 
          friend_id: userId, 
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Error sending friend request:', error);
      } else {
        setPendingRequests(prev => new Set([...prev, userId]));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  //handles friend request
  const handleAcceptFriendRequest = async (userId) => {
    try {
      
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .match({ user_id: userId, friend_id: currentUserId, status: 'pending' });
      
      if (updateError) {
        console.error('Error accepting friend request:', updateError);
      } else {

        setIncomingRequests(prev => {
          const newIncoming = new Set(prev);
          newIncoming.delete(userId);
          return newIncoming;
        });
        setFriends(prev => new Set([...prev, userId]));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleRejectFriendRequest = async (userId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .match({ user_id: userId, friend_id: currentUserId, status: 'pending' });
      
      if (error) {
        console.error('Error rejecting friend request:', error);
      } else {
        setIncomingRequests(prev => {
          const newIncoming = new Set(prev);
          newIncoming.delete(userId);
          return newIncoming;
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  //cancels friend request
  const handleCancelFriendRequest = async (userId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .match({ user_id: currentUserId, friend_id: userId, status: 'pending' });
      
      if (error) {
        console.error('Error canceling friend request:', error);
      } else {
        setPendingRequests(prev => {
          const newPending = new Set(prev);
          newPending.delete(userId);
          return newPending;
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };


  //removes a friend
  const handleRemoveFriend = async (userId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .eq('status', 'accepted');
      
      if (error) {
        console.error('Error removing friend:', error);
      } else {
        setFriends(prev => {
          const newFriends = new Set(prev);
          newFriends.delete(userId);
          return newFriends;
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const getButtonForUser = (user) => {
    if (user.id === currentUserId) {
      return (
        <button className="action-btn you-btn" disabled>
          <FaUser /> You
        </button>
      );
    }

    if (friends.has(user.id)) {
      return (
        <button 
          className="action-btn friend-btn"
          onClick={() => handleRemoveFriend(user.id)}
        >
          <FaUserCheck /> Friends
        </button>
      );
    }

    if (pendingRequests.has(user.id)) {
      return (
        <button 
          className="action-btn pending-btn"
          onClick={() => handleCancelFriendRequest(user.id)}
        >
          <FaClock /> Pending Friend Request
        </button>
      );
    }

    if (incomingRequests.has(user.id)) {
      return (
        <div className="request-actions">
          <button 
            className="action-btn accept-btn"
            onClick={() => handleAcceptFriendRequest(user.id)}
          >
            <FaUserCheck /> Accept
          </button>
          <button 
            className="action-btn reject-btn"
            onClick={() => handleRejectFriendRequest(user.id)}
          >
            <FaUserTimes /> Reject
          </button>
        </div>
      );
    }

    return (
      <button 
        className="action-btn add-btn"
        onClick={() => handleSendFriendRequest(user.id)}
      >
        <FaUserPlus /> Add Friend
      </button>
    );
  };

  if (loading) {
    return (
      <div className="add-profile-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-profile-page">
      <div className="ap-header">
        <h1>Add Friends</h1>
        <p>Discover and connect with other users</p>
      </div>

      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="results-count">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">
              {user.profile_image ? (
                <img src={user.profile_image} alt={user.display_name} />
              ) : (
                <div className="avatar-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            
            <div className="user-info">
              <h3 className="user-name">{user.display_name}</h3>
              <p className="user-email">{user.email}</p>
              {user.bio && (
                  <p className="user-bio">
                    {user.bio.length > 25 ? `${user.bio.slice(0, 15)}...` : user.bio}
                  </p>
                )}
            </div>

            <div className="user-actions">
              {getButtonForUser(user)}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <FaSearch className="no-results-icon" />
          <h3>No users found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default AddProfile;