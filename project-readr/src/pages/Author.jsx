import React from 'react';
import './Author.css';

const Author = () => {
    // Mock data - in a real app this would come from props or API
    const authorData = {
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
