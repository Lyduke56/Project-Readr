import { motion, useMotionValue, useTransform, useMotionTemplate } from "framer-motion";
import { useNavigate, useLocation  } from "react-router-dom"
import { useState, useRef, useCallback } from "react";
import "./Stack.css";

function CardRotate({ children, onSendToBack, sensitivity, onSwipeLeft, onSwipeRight, cardId, setRemovedCardId, setSwipeFeedback, leftLabelRef, rightLabelRef, onCardClick }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [animateToPosition, setAnimateToPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Dynamic border color and thickness based on swipe distance
  const borderColor = useTransform(x, [-500, 0, 500], ['rgba(244, 67, 54, 1)', 'rgba(0, 0, 0, 0)', 'rgba(76, 175, 80, 1)']);
  const borderWidth = useTransform(x, [-500, -sensitivity, 0, sensitivity, 500], [5, 2, 0, 2, 5]);

  // Update label styles directly via refs (no React re-renders)
  const updateLabels = useCallback((xValue) => {
    if (leftLabelRef.current && rightLabelRef.current) {
      const leftIsActive = xValue < -50;
      const rightIsActive = xValue > 50;
      
      // Left label
      const leftOpacity = leftIsActive ? Math.min(Math.abs(xValue) / 150, 1) : 0.3;
      const leftScale = leftIsActive ? 1 + (Math.abs(xValue) / 500) : 1;
      const leftColor = leftIsActive ? '#ef4444' : '#9ca3af';
      
      leftLabelRef.current.style.opacity = leftOpacity;
      leftLabelRef.current.style.transform = `scale(${leftScale})`;
      leftLabelRef.current.style.color = leftColor;
      
      // Right label
      const rightOpacity = rightIsActive ? Math.min(Math.abs(xValue) / 150, 1) : 0.3;
      const rightScale = rightIsActive ? 1 + (Math.abs(xValue) / 500) : 1;
      const rightColor = rightIsActive ? '#22c55e' : '#9ca3af';
      
      rightLabelRef.current.style.opacity = rightOpacity;
      rightLabelRef.current.style.transform = `scale(${rightScale})`;
      rightLabelRef.current.style.color = rightColor;
    }
  }, [leftLabelRef, rightLabelRef]);

  // Update labels directly without React state updates
  x.on('change', updateLabels);

  function handleDragStart() {
    setIsDragging(true);
  }

  function handleDragEnd(_, info) {
    setIsDragging(false);
    
    // Reset labels to default state
    if (leftLabelRef.current && rightLabelRef.current) {
      leftLabelRef.current.style.opacity = '0.3';
      leftLabelRef.current.style.transform = 'scale(1)';
      leftLabelRef.current.style.color = '#9ca3af';
      rightLabelRef.current.style.opacity = '0.3';
      rightLabelRef.current.style.transform = 'scale(1)';
      rightLabelRef.current.style.color = '#9ca3af';
    }
    
    if (Math.abs(info.offset.x) > sensitivity) {
      setIsSwiping(true);
      setSwipeDirection(info.offset.x < 0 ? 'left' : 'right');
      if (info.offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (info.offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      }
      // Set the card as removed to prevent rendering during animation
      setRemovedCardId(cardId);
      
      // Animate to target position
      const targetX = info.offset.x < 0 ? -500 : 500;
      setAnimateToPosition({ x: targetX, y: 0 });
      
      // Handle animation completion
      setTimeout(() => {
        setIsSwiping(false);
        onSendToBack();
        setAnimateToPosition({ x: 0, y: 0 });
        // Reset removed card ID after animation to allow re-rendering at back
        setTimeout(() => setRemovedCardId(null), 100);
      }, 300);
      
    } else if (Math.abs(info.offset.y) > sensitivity) {
      setIsSwiping(true);
      
      // Animate to target position
      const targetY = info.offset.y < 0 ? -500 : 500;
      setAnimateToPosition({ x: 0, y: targetY });
      
      // Handle animation completion
      setTimeout(() => {
        setIsSwiping(false);
        onSendToBack();
        setAnimateToPosition({ x: 0, y: 0 });
      }, 300);
      
    } else {
      setAnimateToPosition({ x: 0, y: 0 });
    }
  }

  function handleClick(e) {
    // Only handle click if we weren't dragging
    if (!isDragging && onCardClick) {
      onCardClick(e);
    }
  }

  return (
    <motion.div
      className={`card-rotate ${isSwiping ? `swiping-${swipeDirection}` : ''}`}
      style={{ 
        x, 
        y, 
        rotateX, 
        rotateY,
        borderColor: borderColor,
        borderWidth: borderWidth,
        borderStyle: 'solid'
      }}
      animate={{
        x: animateToPosition.x,
        y: animateToPosition.y,
        opacity: isSwiping ? 0 : 1
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      dragMomentum={false}
      whileTap={{ cursor: "grabbing" }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      {children}
    </motion.div>
  );
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cardDimensions = { width: 208, height: 208 },
  cardsData = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  onSwipeLeft,
  onSwipeRight,
  onCardClick, // New prop for handling card clicks
  redirectUrl = "/Book" // Default redirect URL
}) {
  const navigate = useNavigate(); // Add navigate hook
  
  const [cards, setCards] = useState(
    cardsData.length
      ? cardsData.map((card, index) => ({ 
          ...card, 
          id: card.id || `card-${index}-${Date.now()}` 
        }))
      : [
        { id: 1, img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format", title: "Beautiful Landscape", author: "John Doe", genres: "Nature, Photography" },
        { id: 2, img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format", title: "Urban Architecture", author: "Jane Smith", genres: "Architecture, City" },
        { id: 3, img: "https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format", title: "Mountain Views", author: "Bob Johnson", genres: "Adventure, Travel" },
        { id: 4, img: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format", title: "Forest Path", author: "Alice Brown", genres: "Nature, Hiking" }
      ]
  );
  const [removedCardId, setRemovedCardId] = useState(null);
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  
  // Create refs for direct DOM manipulation of labels
  const leftLabelRef = useRef(null);
  const rightLabelRef = useRef(null);

  const getTitleClass = (title) => {
    if (!title) return 's-book-title';
    const length = title.length;
    if (length > 20) return 's-book-title very-long-title';
    if (length > 15) return 's-book-title long-title';
    return 's-book-title';
  };

  const getAuthorClass = (author) => {
    if (!author) return 's-book-author';
    const length = author.length;
    if (length > 40) return 's-book-author very-long-author';
    if (length > 20) return 's-book-author long-author';
    return 's-book-author';
  };

  const getGenreClass = (genre) => {
    if (!genre) return 's-book-genres';
    const length = genre.length;
    if (length > 60) return 's-book-genres very-long-genre';
    if (length > 40) return 's-book-genres long-genre';
    return 's-book-genres';
  };

  const sendToBack = (id) => {
    setCards((prev) => {
      const newCards = [...prev];
      const index = newCards.findIndex((card) => card.id === id);
      if (index !== -1) {
        const [card] = newCards.splice(index, 1);
        newCards.unshift(card);
      }
      return newCards;
    });
  };

  // Helper function to check if card has a valid cover image
  const hasValidCover = (card) => {
    return card.coverUrl || card.img;
  };

  const truncateTitle = (title, maxLength = 30) => {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const truncateAuthor = (author, maxLength = 40) => {
    if (!author) return '';
    if (author.length <= maxLength) return author;
    return author.substring(0, maxLength) + '...';
  };

  const truncateGenre = (genre, maxLength = 50) => {
    if (!genre) return '';
    if (genre.length <= maxLength) return genre;
    return genre.substring(0, maxLength) + '...';
  };

  // Handle card click for redirection
  const handleCardClick = (card) => {
    if (onCardClick) {
      // Use custom click handler if provided
      onCardClick(card);
    } else {
      // Use React Router navigate to redirect to /Book page
      navigate('/Book');
    }
  };

  return (
    <div className="s-discovery-container">
      {/* Skip Book Label - Left Side */}
      <div className="side-label left-label">
        <div 
          ref={leftLabelRef}
          className="label-text"
          style={{
            opacity: 0.3,
            transform: 'scale(1)',
            color: 'brown',
            transition: 'none' // Remove transitions for better performance
          }}
        >
          Skip Book
        </div>
      </div>

      {/* Stack Container */}
      <div
        className="stack-container"
        style={{
          width: cardDimensions.width,
          height: cardDimensions.height,
        }}
      >
        {cards
          .filter(card => card.id !== removedCardId)
          .map((card, index) => {
            const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;

            return (
              <CardRotate
                key={`card-${card.id}`}
                onSendToBack={() => sendToBack(card.id)}
                sensitivity={sensitivity}
                onSwipeLeft={() => onSwipeLeft && onSwipeLeft(card)}
                onSwipeRight={() => onSwipeRight && onSwipeRight(card)}
                cardId={card.id}
                setRemovedCardId={setRemovedCardId}
                setSwipeFeedback={setSwipeFeedback}
                leftLabelRef={leftLabelRef}
                rightLabelRef={rightLabelRef}
                onCardClick={() => handleCardClick(card)}
              >
                <motion.div
                  className="sss-cards"
                  onClick={() => sendToBackOnClick && sendToBack(card.id)}
                  animate={{
                    rotateZ: (cards.length - index - 1) * 4 + randomRotate,
                    scale: 1 + index * 0.06 - cards.length * 0.06,
                    transformOrigin: "90% 90%",
                  }}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: animationConfig.stiffness,
                    damping: animationConfig.damping,
                  }}
                >
                  <div className="s-card-image-container">
                    {hasValidCover(card) ? (
                      <img
                        src={card.coverUrl || card.img}
                        alt={card.title || `card-${card.id}`}
                        className="s-card-image"
                      />
                    ) : (
                      <div className="s-card-image-placeholder">
                        <span className="placeholder-text">Book Cover</span>
                      </div>
                    )}
                  </div>
                  <div className="s-card-content">
                    {card.title && <h3 className={getTitleClass(card.title)}>{truncateTitle(card.title)}</h3>}
                    {card.author && <p className={getAuthorClass(card.author)}>{truncateAuthor(card.author)}</p>}
                    {card.genres && <p className={getGenreClass(card.genres)}>{truncateGenre(card.genres)}</p>}
                  </div>
                </motion.div>
              </CardRotate>
            );
          })}
      </div>

      {/* Save Book Label - Right Side */}
      <div className="side-label right-label">
        <div 
          ref={rightLabelRef}
          className="label-text"
          style={{
            opacity: 0.3,
            transform: 'scale(1)',
            color: 'brown',
            transition: 'none' // Remove transitions for better performance
          }}
        >
          Save Book
        </div>
      </div>
    </div>
  );
}