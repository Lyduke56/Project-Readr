import { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';
import { FaCamera, FaUser, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaBirthdayCake, FaLock, FaGlobe, FaFacebook, FaInstagram, FaEdit } from 'react-icons/fa';

export function EditProfile({ onSaveSuccess }) {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const user = session?.user;

  const [profileData, setProfileData] = useState({
    full_name: '',
    display_name: '',
    email: '',
    bio: '',
    location: '',
    gender: '',
    birth_date: '',
    is_private: false,
    profile_image: '',
    facebook_url: '',
    instagram_url: '',
    x_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch current profile data
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
          // If user doesn't exist in users table, initialize with auth data
          if (error.code === 'PGRST116') {
            setProfileData(prev => ({
              ...prev,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              display_name: user.user_metadata?.display_name || ''
            }));
          }
        } else if (data) {
          setProfileData({
            full_name: data.full_name || '',
            display_name: data.display_name || '',
            email: data.email || user.email || '',
            bio: data.bio || '',
            location: data.location || '',
            gender: data.gender || '',
            birth_date: data.birth_date || '',
            is_private: data.is_private || false,
            profile_image: data.profile_image || '',
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            x_url: data.x_url || ''
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, user?.email, user?.user_metadata]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_image: 'Image must be less than 5MB' }));
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, profile_image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' }));
        return;
      }

      setImageFile(file);
      setErrors(prev => ({ ...prev, profile_image: '' }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Supabase storage
  const uploadImage = async (file) => {
    if (!file || !user?.id) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading image to path:', filePath);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Image uploaded successfully, public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!profileData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (profileData.bio && profileData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (profileData.birth_date) {
      const birthDate = new Date(profileData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.birth_date = 'Please enter a valid birth date';
      }
    }

    // Validate URLs (only if they're not empty)
    const urlPattern = /^https?:\/\/.+/;
    if (profileData.facebook_url && profileData.facebook_url.trim() && !urlPattern.test(profileData.facebook_url)) {
      newErrors.facebook_url = 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (profileData.instagram_url && profileData.instagram_url.trim() && !urlPattern.test(profileData.instagram_url)) {
      newErrors.instagram_url = 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (profileData.x_url && profileData.x_url.trim() && !urlPattern.test(profileData.x_url)) {
      newErrors.x_url = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setErrors({ general: 'User session is invalid. Please log in again.' });
      return;
    }

    setSaving(true);
    setSuccessMessage('');

    try {
      let imageUrl = profileData.profile_image;

      // Upload new image if selected
      if (imageFile) {
        try {
          const uploadedImageUrl = await uploadImage(imageFile);
          if (uploadedImageUrl) {
            imageUrl = uploadedImageUrl;
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          setErrors({ profile_image: 'Failed to upload image. Please try again.' });
          setSaving(false);
          return;
        }
      }

      // Prepare data for update/insert
      const userData = {
        id: user.id,
        email: profileData.email,
        full_name: profileData.full_name || null,
        display_name: profileData.display_name || null,
        bio: profileData.bio || null,
        location: profileData.location || null,
        gender: profileData.gender || null,
        birth_date: profileData.birth_date || null,
        is_private: profileData.is_private,
        profile_image: imageUrl || null,
        facebook_url: profileData.facebook_url || null,
        instagram_url: profileData.instagram_url || null,
        x_url: profileData.x_url || null,
        updated_at: new Date().toISOString()
      };

      console.log('Saving user data:', userData);

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving profile:', error);
        setErrors({ general: `Failed to save profile: ${error.message}` });
      } else {
        console.log('Profile saved successfully');
        
        // Call success callback if provided
        if (onSaveSuccess) {
          onSaveSuccess(userData);
        }
        
        // Navigate to profile and refresh the page
        navigate('/Profile');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h1><FaEdit /> Edit Profile</h1>
        <p>Update your personal information and preferences</p>
      </div>

      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* Profile Image Section */}
        <div className="form-section">
          <h3><FaCamera /> Profile Picture</h3>
          <div className="image-upload-section">
            <div className="current-image">
              {imagePreview || profileData.profile_image ? (
                <img 
                  src={imagePreview || profileData.profile_image} 
                  alt="Profile preview"
                  className="profile-image-preview"
                />
              ) : (
                <div className="image-placeholder">
                  <FaUser size={50} />
                  <span>No Image</span>
                </div>
              )}
            </div>
            <div className="image-upload-controls">
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="profile-image" className="file-input-label">
                <FaCamera /> Choose Image
              </label>
              <small>Max file size: 5MB. Accepted formats: JPG, PNG, GIF, WebP</small>
              {errors.profile_image && <span className="error-text">{errors.profile_image}</span>}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3><FaUser /> Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="full_name">
                <FaUser /> Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
              {errors.full_name && <span className="error-text">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="display_name">
                <FaEdit /> Display Name
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={profileData.display_name}
                onChange={handleInputChange}
                placeholder="How you want to be known"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope /> Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                disabled
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="location">
                <FaMapMarkerAlt /> Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={profileData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="form-section">
          <h3><FaBirthdayCake /> Personal Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleInputChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="birth_date">
                <FaCalendarAlt /> Birth Date
              </label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={profileData.birth_date}
                onChange={handleInputChange}
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.birth_date && <span className="error-text">{errors.birth_date}</span>}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="form-section">
          <h3>About You</h3>
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself, your reading interests, favorite genres..."
              rows="4"
              maxLength="500"
            />
            <small>{profileData.bio.length}/500 characters</small>
            {errors.bio && <span className="error-text">{errors.bio}</span>}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="form-section">
          <h3>Social Media</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="facebook_url">
                <FaFacebook /> Facebook URL
              </label>
              <input
                type="url"
                id="facebook_url"
                name="facebook_url"
                value={profileData.facebook_url}
                onChange={handleInputChange}
                placeholder="https://facebook.com/yourusername"
              />
              {errors.facebook_url && <span className="error-text">{errors.facebook_url}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="instagram_url">
                <FaInstagram /> Instagram URL
              </label>
              <input
                type="url"
                id="instagram_url"
                name="instagram_url"
                value={profileData.instagram_url}
                onChange={handleInputChange}
                placeholder="https://instagram.com/yourusername"
              />
              {errors.instagram_url && <span className="error-text">{errors.instagram_url}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="x_url">X (Twitter) URL</label>
              <input
                type="url"
                id="x_url"
                name="x_url"
                value={profileData.x_url}
                onChange={handleInputChange}
                placeholder="https://x.com/yourusername"
              />
              {errors.x_url && <span className="error-text">{errors.x_url}</span>}
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="form-section">
          <h3><FaLock /> Privacy Settings</h3>
          <div className="form-group checkbox-group">
            <label htmlFor="is_private" className="checkbox-label">
              <input
                type="checkbox"
                id="is_private"
                name="is_private"
                checked={profileData.is_private}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              <span className="ep-label-text">
                {profileData.is_private ? <FaLock /> : <FaGlobe />}
                Make my profile private
              </span>
            </label>
            <small>
              {profileData.is_private 
                ? "Only you can see your profile information" 
                : "Other users can view your public profile"
              }
            </small>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="save-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="button-spinner"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}