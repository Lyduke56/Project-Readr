import { useState, useRef } from "react";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useEffect } from "react";

import "./AddInfo.css";

export function AddInfo() {
    
  const fileInputRef = useRef(null);
  const { session, insertUser } = UserAuth();
  const user = session?.user;

  //initialization user's info
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    display_name: "",
    bio: "",
    profile_image: "",
    location: "",
    website_url: "",
    gender: "", 
    birth_date: "",
    is_private: false,
  });

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  //handles image uploading into db storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user?.id) {
      setError("User session is not ready. Please try again in a moment.");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP).");
      return;
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File size must be less than 5MB.");
      return;
    }

    setUploading(true);
    setError(""); // Clear any previous errors

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; 

      console.log("Uploading file:", fileName, "to path:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Failed to upload image: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      console.log("Public URL data:", publicData);

      if (!publicData?.publicUrl) {
        setError("Failed to get public URL for uploaded image.");
        setUploading(false);
        return;
      }

      // Update form data with the public URL
      setFormData(prev => ({
        ...prev,
        profile_image: publicData.publicUrl,
      }));

      console.log("Profile image URL set:", publicData.publicUrl);
      
    } catch (err) {
      console.error("Image upload error:", err);
      setError("An error occurred while uploading the image.");
    } finally {
      setUploading(false);
    }
  };

  //submit handling - double checks before inserting to db
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    // Check if image is still uploading
    if (uploading) {
      setError("Please wait for the image upload to complete.");
      setLoading(false);
      return;
    }

    try {
      console.log("Current auth UID:", user?.id);
      console.log("Form data before submission:", formData);
      
      // Prepare data with proper null handling
      const userData = {
        id: user.id,
        email: formData.email,
        full_name: formData.full_name || null,
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        profile_image: formData.profile_image || null, // This should not be null if upload succeeded
        location: formData.location || null,
        website_url: formData.website_url || null,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        is_private: formData.is_private,
      };

      console.log("User data being sent:", userData);

      const result = await insertUser(userData);

      if (result.success) {
        setSuccess("User profile created successfully!");
        setFormData({
          email: "",
          full_name: "",
          display_name: "",
          bio: "",
          profile_image: "",
          location: "",
          website_url: "",
          gender: "",
          birth_date: "",
          is_private: false,
        });
      } else {
        setError(result.error?.message || "Failed to create user profile");
        console.error("Insert user error:", result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { //Autofill user email
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  return (
    <div className="addinfo-container">
      <div className="form-header">
        <h1 className="form-title">
          Complete Your <span className="highlight">Readr</span> Profile
        </h1>
        <p className="form-subtitle">
          Tell us more about yourself to personalize your reading experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="addinfo-form">

        {/* Avatar Upload */}
        <div className="avatar-upload-wrapper">
          <div className="avatar-circle" onClick={handleImageClick}>
            {uploading ? (
              <span>Uploading...</span>
            ) : formData.profile_image ? (
              <img src={formData.profile_image} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
            ) : (
              <span>Upload Photo</span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          {/* Debug info - remove in production */}
          {formData.profile_image && (
            <small style={{display: 'block', marginTop: '5px', color: 'green'}}>
              Image URL: {formData.profile_image}
            </small>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            required
          />
        </div>

        {/* Full Name */}
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            placeholder="Juan C. Tamad"
            required
          />
        </div>

        {/* Display Name */}
        <div className="form-group">
          <label>Display Name</label>
          <input
            type="text"
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="JuanBookLover"
            required
          />
        </div>

        {/* Bio */}
        <div className="form-group">
          <label>Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself, your reading interests, favorite genres..."
            rows="3"
          />
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="New York, NY"
            required
          />
        </div>

        {/* Website */}
        <div className="form-group">
          <label>Website</label>
          <input
            type="url"
            name="website_url"
            value={formData.website_url}
            onChange={handleInputChange}
            placeholder="https://your-website.com"
            required
          />
        </div>

        {/* Gender - Updated with proper options */}
        <div className="form-group">
          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Gender (Optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        {/* Birth Date */}
        <div className="form-group">
          <label>Birth Date</label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleInputChange}
            min="1900-01-01"
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Privacy */}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_private"
              checked={formData.is_private}
              onChange={handleInputChange}
            />
            Make my profile private
          </label>
        </div>

        {/* Feedback */}    
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button
          type="submit"
          disabled={loading || uploading}
          className={`submit-button ${loading ? "loading" : ""}`}
        >
          {loading ? "Creating Profile..." : uploading ? "Please wait (uploading image)..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}