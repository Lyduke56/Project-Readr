import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Author.css';

const Author = () => {
  const { authorId } = useParams();
  const [authorData, setAuthorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        // Mock data - replace with actual API call
        const mockData = {
          name: "Harper Lee",
          birthDate: "April 28, 1926",
          deathDate: "February 19, 2016",
          bio: "Nelle Harper Lee was an American novelist best known for her 1960 novel To Kill a Mockingbird. It won the 1961 Pulitzer Prize and has become a classic of modern American literature.",
          works: [
            { title: "To Kill a Mockingbird", year: 1960 },
            { title: "Go Set a Watchman", year: 2015 }
          ],
          alternateNames: ["Nelle Harper Lee"]
        };
        setAuthorData(mockData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [authorId]);
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading author data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-message">
            <h2>Error Loading Author</h2>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (!authorData) {
      return (
        <div className="error-container">
          <div className="error-message">
            <h2>Author Not Found</h2>
            <p>The requested author could not be found.</p>
          </div>
        </div>
      );
    }

    return (
        <div className="author-container">
            <div className="author-header">
                <div className="author-photo-container">
                    <div className="author-photo-placeholder">👤</div>
                </div>
                <div className="author-info">
                    <h1>{authorData.name}</h1>
                    <div className="author-dates">
                        {authorData.birthDate} - {authorData.deathDate}
                    </div>
                    <div className="author-meta">
                        <div className="meta-item">
                            <span className="label">Known Works</span>
                            <span className="value">{authorData.works.length} book{authorData.works.length !== 1 ? 's' : ''}</span>
                        </div>
                        {authorData.alternateNames && (
                            <div className="meta-item">
                                <span className="label">Also Known As</span>
                                <span className="value">{authorData.alternateNames.join(', ')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="author-section">
                <h3>📝 Biography</h3>
                <p>{authorData.bio}</p>
            </div>

            {authorData.works.length > 0 && (
                <div className="author-section">
                    <h3>📚 Notable Works</h3>
                    <ul className="works-list">
                        {authorData.works.map((work, index) => (
                            <li key={index}>
                                <strong>{work.title}</strong>
                                {work.year && ` (${work.year})`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Author;
