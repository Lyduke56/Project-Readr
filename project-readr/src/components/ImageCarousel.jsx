import { useState, useEffect } from 'react';
import './ImageCarousel.css';

export function ImageCarousel({ imagePath, sections = 4, interval = 5000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % sections);
        }, interval);

        return () => clearInterval(timer);
    }, [sections, interval]);

    const sectionWidth = 100 / sections;

    return (
        <div className="carousel-container">
            <div 
                className="carousel-track"
                style={{ 
                    transform: `translateX(-${currentIndex * sectionWidth}%)`,
                    width: `${sections * 100}%`
                }}
            >
                {[...Array(sections)].map((_, i) => {
                    // Calculate the horizontal position for each section
                    // For a 4-section carousel, we want positions: 0%, 33.33%, 66.66%, 100%
                    const bgPositionX = sections === 1 ? 0 : (i / (sections - 1)) * 100;
                    
                    return (
                        <div 
                            key={i}
                            className="carousel-section"
                            style={{
                                width: `${sectionWidth}%`,
                                backgroundImage: `url(${imagePath})`,
                                backgroundPosition: `${bgPositionX}% center`,
                                backgroundSize: 'auto 100%',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}