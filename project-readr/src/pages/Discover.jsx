import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import './Discover.css';

const mockBooks = [
  {
    title: "I Have No Mouth & I Must Scream",
    author: "Ellison, Harlan",
    genres: "Science Fiction, Speculative Fiction, Horror",
    coverUrl: "/485894.png"
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genres: "Fiction, Southern Gothic, Bildungsroman",
    coverUrl: "/960px-To_Kill_a_Mockingbird_(first_edition_cover).png"
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genres: "Tragedy, Jazz Age",
    coverUrl: "/The_Great_Gatsby_Cover_1925_Retouched.png"
  }
];

const BookCard = ({ book, onSwipeLeft, onSwipeRight }) => {
  const [swipingDirection, setSwipingDirection] = useState(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setSwipingDirection(null);
      onSwipeLeft(book);
    },
    onSwipedRight: () => {
      setSwipingDirection(null);
      onSwipeRight(book);
    },
    onSwiping: (eventData) => {
      setSwipingDirection(eventData.dir);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const cardClass = swipingDirection 
    ? `book-card swiping-${swipingDirection.toLowerCase()}`
    : 'book-card';

  return (
    <div className={cardClass} {...handlers}>
      <div className="book-image">
        <img 
          src={book.coverUrl} 
          alt={book.title}
          className="book-cover"
        />
      </div>
      <h3 className="book-title">{book.title}</h3>
      <p className="book-author">{book.author}</p>
      <p className="book-genres">{book.genres}</p>
    </div>
  );
};

const DiscoverPage = () => {
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [savedBooks, setSavedBooks] = useState([]);

  const handleSwipeLeft = (book) => {
    console.log(`Not saving: ${book.title}`);
    goToNextBook();
  };

  const handleSwipeRight = (book) => {
    console.log(`Saving: ${book.title}`);
    setSavedBooks([...savedBooks, book]);
    goToNextBook();
  };

  const goToNextBook = () => {
    setCurrentBookIndex((prevIndex) => 
      prevIndex < mockBooks.length - 1 ? prevIndex + 1 : 0
    );
  };

  return (
    <div className="discover-container">
      <h1 className="discover-title">Discover Books</h1>
      <div className="book-card-container">
        {mockBooks.length > 0 && (
          <BookCard
            book={mockBooks[currentBookIndex]}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}
      </div>
      <div className="swipe-instructions">
        <p>Swipe right to save, left to skip</p>
      </div>
    </div>
  );
};

export default DiscoverPage;