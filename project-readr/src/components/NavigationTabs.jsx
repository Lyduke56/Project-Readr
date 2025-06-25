import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavigationTabs.css';

export const NavigationTabs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Books');
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Books') {
      navigate('/Homepage');
    } else if (tab === 'Authors') {
      navigate('/Author');
    } else if (tab === 'Discover') {
      navigate('/Discover');
    }
  };

  const handleSearch = (query) => {
    // Implement search functionality
    console.log('Searching for:', query, 'in', activeTab);
  };

  return (
    <div className="navigation-section">
      <div className="container">
        <div className="navigation-content">
          <div className="tab-buttons">
            {['Books', 'Authors', 'Discover'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="search-controls">
            <select 
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="filter-select"
            >
              <option value="Books">Books</option>
              <option value="Authors">Authors</option>
              <option value="Discover">Discover</option>
            </select>
            
            <input
              type="text"
              placeholder="Search Books, Authors, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="search-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
