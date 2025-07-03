import { useState, useEffect } from 'react';
import './ImageCarousel.css';

export function ImageCarousel({ imagePath, sections = 4, interval = 5000, sectionPositions }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // If custom positions not provided, use equal divisions
    const positions = sectionPositions || Array.from({length: sections}, (_, i) => (i / (sections - 1)) * 100);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % sections);
        }, interval);

        return () => clearInterval(timer);
    }, [sections, interval]);

    return (
        <div className="carousel-container">
            <div
                className="carousel-image"
                style={{
                    backgroundImage: `url(${imagePath})`,
                    backgroundPosition: `${positions[currentIndex]}% center`,
                }}
            />
        </div>
    );
}
