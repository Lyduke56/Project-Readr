import { useState, useRef } from "react";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useEffect } from "react";

import "./AddInfo.css";

export function AddInfo() {
    
  const fileInputRef = useRef(null);
  const { session, insertUser } = UserAuth();
  const user = session?.user;

  //initialization user;s info
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

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`; 

    const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file);

    if (uploadError) {
      setError("Failed to upload image.");
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

    setFormData(prev => ({
    ...prev,
    profile_image: publicData?.publicUrl || '',
    }));
    
    setUploading(false);
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

    try {
        console.log("Current auth UID:", user?.id);
        
        // Prepare data with proper null handling
        const userData = {
          id: user.id,
          email: formData.email,
          full_name: formData.full_name || null,
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          profile_image: formData.profile_image || null,
          location: formData.location || null,
          website_url: formData.website_url || null,
          gender: formData.gender || null,
          birth_date: formData.birth_date || null,
          is_private: formData.is_private,
        };

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
              <img src={formData.profile_image} alt="avatar" />
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
            min="1900"
            max={new Date().getFullYear()}
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
          disabled={loading}
          className={`submit-button ${loading ? "loading" : ""}`}
        >
          {loading ? "Creating Profile..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}