async function fetchData() {
    const searchTitle = document.getElementById("searchTitle")?.value?.trim();
    const titleEl = document.getElementById("bookTitle");
    const coverImg = document.getElementById("bookCover");

    // Check if required elements exist
    if (!titleEl || !coverImg) {
        console.error("Required HTML elements not found");
        return;
    }

    // Hide cover image initially and clear previous data
    coverImg.style.display = "none";
    coverImg.src = "";
    titleEl.textContent = "";

    // Validate search input
    if (!searchTitle || searchTitle.length === 0) {
        titleEl.textContent = "Please enter a book title.";
        return;
    }

    // Show loading state
    titleEl.textContent = "Searching...";

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTitle)}&limit=1`);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Comprehensive null/undefined checking
        if (data && 
            data.docs && 
            Array.isArray(data.docs) && 
            data.docs.length > 0 && 
            data.docs[0]) {
            
            const book = data.docs[0];
            
            // Safe property access with fallbacks
            const title = book.title && typeof book.title === 'string' && book.title.trim() 
                ? book.title.trim() 
                : "No title available";
            
            const author = book.author_name && 
                          Array.isArray(book.author_name) && 
                          book.author_name.length > 0
                ? book.author_name
                    .filter(name => name && typeof name === 'string' && name.trim())
                    .join(", ")
                : "Unknown author";
            
            const coverId = book.cover_i && 
                           (typeof book.cover_i === 'number' || typeof book.cover_i === 'string') && 
                           book.cover_i.toString().trim()
                ? book.cover_i
                : null;

            // Set the title text in the h1 element
            titleEl.textContent = `${title} — ${author}`;

            // Handle cover image with the fixed height styling
            if (coverId) {
                const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
                
                // Add error handling for image loading
                coverImg.onload = function() {
                    // Image loaded successfully - show it
                    coverImg.style.display = "block";
                    // Maintain aspect ratio with object-fit
                    coverImg.style.objectFit = "cover";
                    coverImg.style.width = "auto";
                };
                
                coverImg.onerror = function() {
                    console.warn(`Failed to load cover image for ID: ${coverId}`);
                    // Try medium size as fallback
                    if (coverUrl.includes('-L.jpg')) {
                        const mediumUrl = coverUrl.replace('-L.jpg', '-M.jpg');
                        coverImg.src = mediumUrl;
                    } else {
                        // If medium size also fails, hide the image
                        coverImg.style.display = "none";
                    }
                };
                
                coverImg.src = coverUrl;
                coverImg.alt = `Cover of ${title}`;
            } else {
                // No cover available
                coverImg.style.display = "none";
                coverImg.alt = "No cover available";
            }
            
        } else {
            // No results found
            titleEl.textContent = "No books found. Try a different search term.";
            coverImg.style.display = "none";
        }
        
    } catch (error) {
        console.error("Fetch error:", error);
        
        // Provide more specific error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            titleEl.textContent = "Network error. Please check your connection.";
        } else if (error.message.includes('HTTP error')) {
            titleEl.textContent = "Server error. Please try again later.";
        } else if (error.name === 'SyntaxError') {
            titleEl.textContent = "Invalid response from server.";
        } else {
            titleEl.textContent = "Error fetching data. Please try again.";
        }
        
        coverImg.style.display = "none";
    }
}

// Allow Enter key to trigger search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById("searchTitle");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                fetchData();
            }
        });
        
        // Focus on the input field when page loads
        searchInput.focus();
    }
});