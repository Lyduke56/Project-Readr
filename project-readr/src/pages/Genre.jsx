import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Genre.css';

const GenrePage = () => {
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [filteredGenres, setFilteredGenres] = useState([]);
  const navigate = useNavigate();

  // Mock data for genres - this will be replaced with API integration later
const mockGenres = [
  'Action', 'Adult Fiction', 'Adventure', 'Adventurous', 'Aliens', 'American Literature', 
  'Ancient Egypt', 'Ancient Greece', 'Ancient Rome', 'Anthology', 'Art', 'Artificial Intelligence', 
  'Assassins', 'Autobiography', 'Award Winner', 'Belonging', 'Bestseller', 'Betrayal', 
  'Biography', 'Bittersweet', 'Boarding School', 'Book Club Pick', 'British Literature', 
  'Business', 'Cafe', 'Caldecott Medal', 'Castle', 'Challenging', 'Children', 'Chronicles', 
  'Classic Literature', 'Clones', 'Cold War', 'Comfort Read', 'Coming Of Age', 'Cooking', 
  'Courage', 'Crime', 'Critically Acclaimed', 'Cyberpunk', 'Dark', 'Desert', 'Detectives', 
  'Dragons', 'Drama', 'Dreams', 'Dystopian', 'Early Reader', 'Easy Read', 'Education', 
  'Educational', 'Emotional', 'Entertaining', 'Epic Fantasy', 'Escapist', 'Escape', 
  'Espionage', 'Essays', 'Fairy Tales', 'Family Saga', 'Fantasy', 'Fiction', 'Folklore', 
  'Forgiveness', 'Freedom', 'French Literature', 'Funny', 'Future', 'Ghosts', 'Goodreads Choice', 
  'Gothic', 'Great Depression', 'Greek Classics', 'Gritty', 'Haunted House', 'Healing', 
  'Health', 'Heartwarming', 'High Fantasy', 'Historical Fiction', 'Historical Romance', 
  'History', 'Hope', 'Horror', 'Hospital', 'Hugo Award', 'Humor', 'Humorous', 'Identity', 
  'Informative', 'Inspirational', 'Island', 'Journalism', 'Justice', 'Knights', 'Law', 
  'Legal Thriller', 'LGBTQ+', 'Library', 'Literature', 'LitRPG', 'Long Reads', 'Loss', 
  'Love Story', 'Magic', 'Magical Realism', 'Mathematics', 'Medieval', 'Melancholic', 
  'Memoir', 'Middle Grade', 'Military Fiction', 'Modernist Literature', 'Mountain', 
  'Multicultural', 'Must Read', 'Mystery', 'Mysterious', 'Mythology', 'National Book Award', 
  'Nature', 'New Adult', 'Newbery Medal', 'Nobel Prize', 'Noir', 'Non-Fiction', 'Nostalgic', 
  'Novel', 'Oprah Book Club', 'Page Turner', 'Paranormal', 'Parenting', 'Peaceful', 
  'Philosophy', 'Picture Book', 'Pirates', 'Poetry', 'Politics', 'Prison', 'Prize Winner', 
  'Psychological Thriller', 'Psychology', 'Pulitzer Prize', 'Quick Read', 'Quirky', 
  'Realistic Fiction', 'Rebels', 'Redemption', 'Religion', 'Renaissance', 'Revenge', 
  'Roaring Twenties', 'Robots', 'Romance', 'Romantic', 'Royals', 'Russian Literature', 
  'Sacrifice', 'Saga', 'Science', 'Science Fiction', 'Second Chances', 'Self-Help', 
  'Series', 'Short Stories', 'Slice Of Life', 'Slow Burn', 'Small Town', 'Spaceship', 
  'Speculative Fiction', 'Spies', 'Spy Fiction', 'Staff Pick', 'Standalone', 'Steampunk', 
  'Superheroes', 'Supernatural', 'Survival', 'Suspense', 'Tales', 'Technology', 'Thieves', 
  'Thought-Provoking', 'Thriller', 'Time Travel', 'Transgressive', 'Travel', 'Trilogy', 
  'True Crime', 'Underwater', 'Underground', 'Uplifting', 'Urban Fantasy', 'Vampire', 
  'Victorian', 'Victorian Literature', 'Werewolves', 'Western', 'Wholesome', 'Wild West', 
  'Witches', 'Witty', 'World Literature', 'World War', 'Young Adult', 'Zombie'
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