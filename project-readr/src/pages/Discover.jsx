import React, { useState } from 'react';
import Stack from '../components/Stack';
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


const DiscoverPage = () => {
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [savedBooks, setSavedBooks] = useState([]);
  const [swipedBooks, setSwipedBooks] = useState([]);

  const handleSwipeLeft = (book) => {
    console.log(`Not saving: ${book.title}`);
    setSwipedBooks([...swipedBooks, book.title]);
    goToNextBook();
  };

  const handleSwipeRight = (book) => {
    console.log(`Saving: ${book.title}`);
    setSavedBooks([...savedBooks, book]);
    setSwipedBooks([...swipedBooks, book.title]);
    goToNextBook();
  };

  const goToNextBook = () => {
    setCurrentBookIndex((prevIndex) => 
      prevIndex < mockBooks.length - 1 ? prevIndex + 1 : 0
    );
  };

  const visibleBooks = mockBooks.filter(book => !swipedBooks.includes(book.title));

  return (
    <div className="discover-container">
      <h1 className="discover-title">Discover Books</h1>
      <div className="book-card-container">
        <Stack
          cardsData={visibleBooks}
          cardDimensions={{ width: 300, height: 450 }}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </div>
      <div className="swipe-instructions">
        <p>Swipe right to save, left to skip</p>
      </div>
    </div>
  );
};

export default DiscoverPage;
