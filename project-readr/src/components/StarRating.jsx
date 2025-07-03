import { FaStar } from "react-icons/fa";

// Star Rating Component
export const StarRating = ({ rating, onRating, hover, onHover, readonly = false, size = 25 }) => {
    return (
      <div className="star-rating">
        {[...Array(5)].map((star, index) => {
          const currentRating = index + 1;
          return (
            <label key={index}>
              {!readonly && (
                <input
                  type="radio"
                  name="rating"
                  value={currentRating}
                  onClick={() => onRating && onRating(currentRating)}
                  style={{ display: 'none' }}
                />
              )}
              <FaStar
                className={`star ${readonly ? 'readonly' : 'interactive'}`}
                size={size}
                color={currentRating <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                onMouseEnter={() => !readonly && onHover && onHover(currentRating)}
                onMouseLeave={() => !readonly && onHover && onHover(null)}
                style={{ cursor: readonly ? 'default' : 'pointer' }}
              />
            </label>
          );
        })}
      </div>
    );
  };