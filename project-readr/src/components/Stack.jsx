import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import "./Stack.css";

function CardRotate({ children, onSendToBack, sensitivity, onSwipeLeft, onSwipeRight, cardId, setRemovedCardId, setSwipeFeedback }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [animateToPosition, setAnimateToPosition] = useState({ x: 0, y: 0 });
  
  // Dynamic border color and thickness based on swipe distance
  const borderColor = useTransform(x, [-500, 0, 500], ['rgba(244, 67, 54, 1)', 'rgba(0, 0, 0, 0)', 'rgba(76, 175, 80, 1)']);
  const borderWidth = useTransform(x, [-500, -sensitivity, 0, sensitivity, 500], [5, 2, 0, 2, 5]);

  function handleDragEnd(_, info) {
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
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
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
  onSwipeRight
}) {
  const [cards, setCards] = useState(
    cardsData.length
      ? cardsData.map((card, index) => ({ 
          ...card, 
          id: card.id || `card-${index}-${Date.now()}` 
        }))
      : [
        { id: 1, img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format" },
        { id: 2, img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format" },
        { id: 3, img: "https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format" },
        { id: 4, img: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format" }
      ]
  );
  const [removedCardId, setRemovedCardId] = useState(null);
  const [swipeFeedback, setSwipeFeedback] = useState(null);

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

  return (
    <div
      className="stack-container"
      style={{
        width: cardDimensions.width,
        height: cardDimensions.height,
        perspective: 600,
      }}
    >
      {cards
        .filter(card => card.id !== removedCardId)
        .map((card, index) => {
          const randomRotate = randomRotation
            ? Math.random() * 10 - 5
            : 0;

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
            >
              <motion.div
                className="card"
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
                style={{
                  width: cardDimensions.width,
                  height: cardDimensions.height,
                }}
              >
                <div className="card-image-container">
                  {card.coverUrl ? (
                    <img
                      src={card.coverUrl}
                      alt={card.title || `card-${card.id}`}
                      className="card-image"
                    />
                  ) : (
                    <img
                      src={card.img}
                      alt={`card-${card.id}`}
                      className="card-image"
                    />
                  )}
                </div>
                <div className="card-content">
                  {card.title && <h3 className="book-title">{card.title}</h3>}
                  {card.author && <p className="book-author">{card.author}</p>}
                  {card.genres && <p className="book-genres">{card.genres}</p>}
                </div>
              </motion.div>
            </CardRotate>
          );
        })}
    </div>
  );
}
