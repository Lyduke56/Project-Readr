import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Genre.css';

const GenrePage = () => {
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [filteredGenres, setFilteredGenres] = useState([]);
  const navigate = useNavigate();

  // Mock data for genres - this will be replaced with API integration later
  const mockGenres = [
    'Action', 'Adventure', 'Anthology', 'Art', 'Autobiography', 
    'Biography', 'Business',
    'Children', 'Comedy', 'Comics', 'Coming of Age', 'Cooking', 'Crime', 'Cyberpunk',
    'Drama', 'Dystopian',
    'Education', 'Epic Fantasy', 'Espionage',
    'Fairy Tales', 'Family Saga', 'Fantasy', 'Fiction', 'Folklore',
    'Gothic', 'Graphic Novel',
    'Health', 'High Fantasy', 'Historical Fiction', 'Historical Romance', 'History', 'Horror', 'Humor',
    'Inspirational',
    'Journalism',
    'Law', 'Legal Thriller', 'LGBTQ+', 'Light Novel', 'Literature', 'LitRPG',
    'Magical Realism', 'Manga', 'Mathematics', 'Memoir', 'Military Fiction', 'Multicultural', 'Mystery', 'Mythology',
    'Nature', 'New Adult', 'Noir', 'Non-fiction', 'Novel',
    'Paranormal', 'Parenting', 'Philosophy', 'Picture Book', 'Poetry', 'Politics', 'Post-Apocalyptic', 'Psychology', 'Psychological Thriller',
    'Realistic Fiction', 'Religion', 'Romance',
    'Satire', 'Science', 'Science Fiction', 'Self-help', 'Short Stories', 'Slice of Life', 'Space Opera', 'Speculative Fiction', 'Sports', 'Spy Fiction', 'Steampunk', 'Supernatural', 'Survival', 'Suspense',
    'Technology', 'Thriller', 'Time Travel', 'Transgressive', 'Travel', 'True Crime',
    'Urban Fantasy',
    'Vampire',
    'War', 'Western', 'Women',
    'Young Adult',
    'Zombie'
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
    // Format genre for OpenLibrary API - handle spaces and special characters
    const formattedGenre = genre.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, ''); // Remove special characters except underscores
    
    // Navigate to home page with genre search parameters
    navigate('../Home', { 
      state: { 
        searchTerm: `subject:${formattedGenre}`,
        autoSearch: true,
        displaySearchTerm: genre
      }
    });
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