import { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from "react-router-dom"
import './Profile.css';

export function Profile() {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const user = session?.user;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading books...</p>
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
          <h1 className="display-name">
            {profileData.display_name || profileData.full_name || 'Anonymous Reader'}
          </h1>
          {profileData.display_name && profileData.full_name && (
            <h2 className="full-name">{profileData.full_name}</h2>
          )}
          <div className="profile-status">
            {profileData.is_private ? (
              <span className="status-badge private">🔒 Private Profile</span>
            ) : (
              <span className="status-badge public">🌐 Public Profile</span>
            )}
          </div>
        </div>

        <div className="profile-actions">
          <button className="edit-profile-btn">Edit Profile</button>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="profile-content">
        {profileData.bio && (
          <div className="profile-section">
            <h3>About</h3>
            <p className="bio-text">{profileData.bio}</p>
          </div>
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
              
              {profileData.website_url && (
                <div className="detail-item">
                  <span className="detail-label">Website:</span>
                  <a 
                    href={profileData.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    🔗 {profileData.website_url}
                  </a>
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

        <div className="profile-stats">
          <div className="stat-card">
            <h4>Reading Stats</h4>
            <p>Coming soon...</p>
          </div>
          
          <div className="stat-card">
            <h4>Favorite Genres</h4>
            <p>Coming soon...</p>
          </div>
          
          <div className="stat-card">
            <h4>Reading Goals</h4>
            <p>Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}