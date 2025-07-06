import React, { useState, useEffect } from 'react';
import './Genre.css';

const GenrePage = () => {
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [filteredGenres, setFilteredGenres] = useState([]);

  // Mock data for genres - this will be replaced with API integration later
  const mockGenres = [
    'Action', 'Adventure', 'Autobiography', 'Biography', 'Business',
    'Children', 'Comedy', 'Comics', 'Cooking', 'Crime',
    'Drama', 'Education', 'Fantasy', 'Fiction', 'Folklore',
    'Graphic Novel', 'Health', 'Historical Fiction', 'History', 'Horror',
    'Inspirational', 'Journalism', 'Law', 'Literature', 'Manga',
    'Mathematics', 'Memoir', 'Mystery', 'Mythology', 'Nature',
    'Non-fiction', 'Novel', 'Paranormal', 'Philosophy', 'Poetry',
    'Politics', 'Psychology', 'Religion', 'Romance', 'Science',
    'Science Fiction', 'Self-help', 'Short Stories', 'Sports', 'Suspense',
    'Technology', 'Thriller', 'Travel', 'True Crime', 'War',
    'Western', 'Women', 'Young Adult'
  ];

  // Generate alphabet letters for filtering
  const alphabet = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

  // Filter genres based on selected letter
  useEffect(() => {
    if (selectedLetter === 'All') {
      setFilteredGenres(mockGenres);
    } else {
      const filtered = mockGenres.filter(genre => 
        genre.toLowerCase().startsWith(selectedLetter.toLowerCase())
      );
      setFilteredGenres(filtered);
    }
  }, [selectedLetter]);

  // Group genres by first letter
  const groupGenresByLetter = (genres) => {
    const grouped = {};
    genres.forEach(genre => {
      const firstLetter = genre.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(genre);
    });
    return grouped;
  };

  const groupedGenres = groupGenresByLetter(filteredGenres);

  const handleGenreClick = (genre) => {
    // This will be implemented later for navigation to genre-specific pages
    console.log(`Clicked on genre: ${genre}`);
  };

  return (
    <div className="genre-page">
      <div className="genre-container">
        {/* Header with letter filter */}
        <div className="genre-header">
          <h1 className="genre-title">Genres</h1>
          <p className="genre-subtitle">Explore books by genre</p>
          
          {/* Letter filter buttons */}
          <div className="letter-filter">
            {alphabet.map((letter) => (
              <button
                key={letter}
                className={`letter-button ${selectedLetter === letter ? 'active' : ''}`}
                onClick={() => setSelectedLetter(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Genres grid organized by letters */}
        <div className="genres-content">
          {Object.keys(groupedGenres).length > 0 ? (
            Object.entries(groupedGenres).map(([letter, genres]) => (
              <div key={letter} className="letter-section">
                <h2 className="letter-header">{letter}</h2>
                <div className="genres-grid">
                  {genres.map((genre) => (
                    <div
                      key={genre}
                      className="genre-card"
                      onClick={() => handleGenreClick(genre)}
                    >
                      <span className="genre-name">{genre}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-genres">
              <p>No genres found for the selected letter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenrePage;
