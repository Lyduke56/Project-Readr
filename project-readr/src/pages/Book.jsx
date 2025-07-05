import React, { useState, useEffect } from "react";
import "./Book.css";
import { supabase } from "../supabaseClient";

// StarRating component definition
const StarRating = ({ 
  rating = 0, 
  hover = null, 
  onRating = null, 
  onHover = null, 
  readonly = false, 
  size = 24, 
  className = "" 
}) => {
  const [hoverRating, setHoverRating] = useState(hover);

  const handleMouseEnter = (index) => {
    if (readonly) return;
    setHoverRating(index);
    if (onHover) onHover(index);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(null);
    if (onHover) onHover(null);
  };

  const handleClick = (index) => {
    if (readonly || !onRating) return;
    onRating(index);
  };

  useEffect(() => {
    setHoverRating(hover);
  }, [hover]);

  return (
    <div className={`star-rating ${className} ${readonly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${
            star <= (hoverRating || rating) ? 'filled' : ''
          } ${readonly ? 'readonly' : 'interactive'}`}
          style={{
            fontSize: `${size}px`,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hoverRating || rating) ? '#ffc107' : '#E1CBB3'
          }}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export const Book = () => {
  const [bookData, setBookData] = useState(null);
  const [workDetails, setWorkDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [status, setStatus] = useState("PLAN_TO_READ");

  const [overallRating, setOverallRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userRatingHover, setUserRatingHover] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchRatingsIfReady = async () => {
      if (bookData) {
        await fetchBookRatings(bookData.key || bookData.id);
      }
    };
    fetchRatingsIfReady();
  }, [bookData, currentUser]);
    
  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      setError(null);

      try {
        const selectedBookData = localStorage.getItem("selectedBook");
        if (!selectedBookData) {
          setError("No book selected");
          setLoading(false);
          return;
        }

        const book = JSON.parse(selectedBookData);
        setBookData(book);

        if (book.key) {
          const workKey = book.key.startsWith("/works/")
            ? book.key
            : `/works/${book.key.replace("/books/", "")}`;

          try {
            const workResponse = await fetch(
              `https://openlibrary.org${workKey}.json`
            );
            if (workResponse.ok) {
              const workData = await workResponse.json();
              setWorkDetails(workData);
            }
          } catch (workError) {
            console.warn("Could not fetch work details:", workError);
          }
        }
      } catch (error) {
        console.error("Error fetching book data:", error);
        setError("Failed to load book data");
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, []);

  const fetchBookRatings = async (bookId) => {
    if (!bookId) return;

    try {
      const { data: ratingStats, error: statsError } = await supabase
        .from("book_ratings")
        .select("rating")
        .eq("book_id", bookId);

      if (statsError) {
        console.error("Error fetching rating stats:", statsError);
        return;
      }

      if (ratingStats && ratingStats.length > 0) {
        const total = ratingStats.length;
        const average =
          ratingStats.reduce((sum, r) => sum + r.rating, 0) / total;

        setOverallRating(parseFloat(average.toFixed(1)));
        setTotalRatings(total);
      } else {
        setOverallRating(0);
        setTotalRatings(0);
      }

      if (currentUser) {
        const { data: userRatingData, error: userError } = await supabase
          .from("book_ratings")
          .select("rating")
          .eq("book_id", bookId)
          .eq("user_id", currentUser.id)
          .single();

        if (userError && userError.code !== "PGRST116") {
          console.error("Error fetching user rating:", userError);
        } else if (userRatingData) {
          setUserRating(userRatingData.rating);
        } else {
          setUserRating(0);
        }
      }
    } catch (error) {
      console.error("Error in fetchBookRatings:", error);
    }
  };

  const handleUserRatingSubmit = async (rating) => {
    if (!currentUser || !bookData) return;

    setSubmittingRating(true);

    try {
      const bookId = bookData.key || bookData.id;
      const title = bookData.title || "No title available";
      const author = Array.isArray(bookData.author_name) && bookData.author_name.length > 0
        ? bookData.author_name.filter(name => name?.trim()).slice(0, 2).join(", ")
        : "Unknown author";
      const coverId = bookData.cover_i || bookData.coverID || null;
      const subjects = formatSubjects(workDetails?.subjects || bookData.subject || []);
      const publishYear = bookData.first_publish_year || 
                         bookData.publish_year || 
                         (Array.isArray(bookData.publish_year) ? bookData.publish_year[0] : null) || 
                         "Unknown";

      // Check if the user already has a rating for this book
      const { data: existingRating, error: fetchError } = await supabase
        .from('book_ratings')
        .select('id, rating')
        .eq('book_id', bookId)
        .eq('user_id', currentUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError;
      }

      if (existingRating) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from('book_ratings')
          .update({
            rating: rating,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id);

        if (updateError) throw updateError;
      } else {
        // Create new rating
        const { error: insertError } = await supabase
          .from('book_ratings')
          .insert({
            book_id: bookId,
            user_id: currentUser.id,
            rating: rating,
            book_title: title,
            book_author: author,
            cover_id: coverId,
            subjects: formatSubjects(subjects),
            publish_year: publishYear,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setUserRating(rating);
      
      // Refresh the overall rating stats
      await fetchBookRatings(bookId);

    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getTitleClass = (title) => {
      if (!title) return 'b-title';
      const length = title.length;
      if (length > 45) return 'b-title very-long-title';
      if (length > 30) return 'b-title long-title';
      return 'b-title';
    };

    // Helper function to get author class based on length
    const getAuthorClass = (author) => {
      if (!author) return 'authors';
      const length = author.length;
      if (length > 40) return 'authors very-long-author';
      if (length > 20) return 'authors long-author';
      return 'authors';
    };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    console.log(`Status changed to: ${newStatus}`);
  };

  const handleScoreChange = (newScore) => {
    setUserScore(newScore);
    console.log(`Score changed to: ${newScore}`);
  };

  const handleAddToReadingList = () => {
    // TODO: Implement add to reading list logic
    console.log("Add to reading list clicked");
  };

  const handleClearReview = async () => {
    if (!currentUser || !bookData) return;

    try {
      const bookId = bookData.key || bookData.id;
      
      const { error } = await supabase
        .from('book_ratings')
        .delete()
        .eq('book_id', bookId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update local state
      setUserRating(0);
      
      // Refresh the overall rating stats
      await fetchBookRatings(bookId);

    } catch (error) {
      console.error('Error clearing review:', error);
      setError('Failed to clear review. Please try again.');
    }
  };

  const formatSubjects = (subjects) => {
    if (!subjects || !Array.isArray(subjects)) return null;
    return subjects.slice(0, 10).join(", ");
  };

  const formatAuthors = (authors) => {
    if (!authors) return "Unknown Author";
    if (Array.isArray(authors)) {
      return authors.filter((a) => a?.trim()).slice(0, 3).join(", ");
    }
    return authors;
  };

  const getBookCover = (coverId) => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  };

  const getDescription = () => {
    if (workDetails?.description) {
      if (typeof workDetails.description === "string") {
        return workDetails.description;
      } else if (workDetails.description?.value) {
        return workDetails.description.value;
      }
    }
    return "No description available for this book.";
  };

  const UserRating = () => {
    if (!currentUser) return null;
    return (
      <div className={`b-user-rating ${userRating === 0 ? 'b-no-user-rating' : ''}`}>
        <h4>Your Rating</h4>
        <div className="rating-input">
          <div className="rating-input-left">
              <StarRating
                rating={userRating}
                hover={userRatingHover}
                onRating={handleUserRatingSubmit}
                onHover={setUserRatingHover}
                readonly={submittingRating}
                size={34}
                className={userRating === 0 ? 'empty-rating' : ''}
              />
              <div className="rating-text-container">
                {submittingRating && (
                  <span className="submitting-text">Submitting...</span>
                )}
                {userRating > 0 && (
                  <span className="rating-text">
                    You rated this book {userRating}/5
                  </span>
                )}
              </div>
          </div>
          {userRating > 0 && (
            <button 
              className="clear-review-btn"
              onClick={handleClearReview}
              type="button"
            >
              Clear Review
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading book data...</p>
        </div>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="error-message">
        <h3>Error</h3>
        <p>{error || "Failed to load book data"}</p>
      </div>
    );
  }

  const title = bookData.title || "Unknown Title";
  const authors = formatAuthors(bookData.author_name);
  const publishYear = bookData.first_publish_year || 
                       bookData.publish_year || 
                       (Array.isArray(bookData.publish_year) ? bookData.publish_year[0] : null) || 
                       "Unknown";
  const coverId = bookData.cover_i || bookData.coverID || null;
  const subjects = workDetails?.subjects || bookData.subject || [];
  const editionCount = bookData.edition_count || "Unknown";

  return (
    <div className="book-page">
      <div className="book-container">
        <div className="book-detail-header">
          <div className="book-cover-container">
            {coverId ? (
              <img
                className="book-detail-cover"
                alt={`Cover of ${title}`}
                src={getBookCover(coverId)}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="book-detail-cover placeholder"
              style={{ display: coverId ? "none" : "flex" }}
            >
              <span>No Cover Available</span>
            </div>
          </div>

          <div className="book-detail-info">
            <div className="book-header-top">
              <h1 className={getTitleClass(title)}>{title}</h1>
              <button 
                className="add-to-reading-list-btn"
                onClick={handleAddToReadingList}
                type="button"
              >
                Add to Reading List
              </button>
            </div>
            <div className={getAuthorClass(authors)}>by {authors}</div>

            <div className="meta">
              <div className="meta-item emphasized">
                <div className="label">Year Published</div>
                <div className="value">{publishYear}</div>
              </div>
              <div className="meta-item emphasized">
                <div className="label">Edition Count</div>
                <div className="value">{editionCount}</div>
              </div>
              {bookData.isbn && (
                <div className="meta-item emphasized">
                  <div className="label">ISBN</div>
                  <div className="value">
                    {Array.isArray(bookData.isbn)
                      ? bookData.isbn[0]
                      : bookData.isbn}
                  </div>
                </div>
              )}
              {bookData.publisher && (
                <div className="meta-item emphasized">
                  <div className="label">Publisher</div>
                  <div className="value">
                    {Array.isArray(bookData.publisher)
                      ? bookData.publisher[0]
                      : bookData.publisher}
                  </div>
                </div>
              )}
            </div>

            <div className="rating-section">
              <div className="overall-rating">
                <h4>Overall Rating</h4>
                <div className={`rating-display ${overallRating === 0 ? 'no-ratings' : ''}`}>
                  <StarRating
                    rating={overallRating}
                    readonly={true}
                    size={30}
                    className={overallRating === 0 ? 'empty-rating' : ''}
                  />
                  <span className="rating-text">
                    {overallRating > 0
                      ? `${overallRating}/5`
                      : "No ratings yet"}
                    {totalRatings > 0 &&
                      ` (${totalRatings} rating${
                        totalRatings !== 1 ? "s" : ""
                      })`}
                  </span>
                </div>
              </div>

              <UserRating />

              {!currentUser && (
                <div className="login-prompt">
                  <p>Please log in to rate this book</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="description">
          <h3>Synopsis</h3>
          <p>{getDescription()}</p>
        </div>

        {subjects.length > 0 && (
          <div className="subjects">
            <h3>Subjects</h3>
            <p>{formatSubjects(subjects)}</p>
          </div>
        )}

        <div className="b-book-reviews">
          <h3>User Reviews</h3>
          <div className="no-reviews">
            <p>
              No user reviews available yet. Be the first to write a review!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};