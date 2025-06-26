import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom"
import './Home.css';

export const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('All');
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate to /BookInformation page
    // This would typically use React Router
    navigate ('/BookInformation');
  };

  const handleAddToReadingList = (e) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    console.log('Added to reading list');
    // Add your logic here to add book to reading list
  };

  return (
    <div className="home-container">
      <header className="header">
        
        <div className="controls">

            <h1 className="pages-title">Meet your next favorite read!</h1>

            <div className="search-controls">
                <select 
                    className="filter-dropdown"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                >
                    <option value="All">All</option>
                    <option value="Book">Book</option>
                    <option value="Author">Author</option>
                </select>
                
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Search your reading list..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </header>

      <div className="books-grid">
            <div className="book-card" onClick={handleCardClick}>
                <div className='book-cover'>
                    <div className="book-cover-holder">
                        <span>Book Cover</span>
                    </div>
                </div>
            
                <div className='book-information'>
                    <h3 className="book-titles">The Great Gatsby</h3>
                    <p className="book-authors">by F. Scott Fitzgerald</p>
                    
                    <button 
                    className="add-to-list-btn"
                    onClick={handleAddToReadingList}
                    >
                    Add to Reading List
                    </button>
                </div>
            </div>
        </div>
    </div>
    
  );
};

export default Home;