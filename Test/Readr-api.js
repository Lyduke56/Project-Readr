async function fetchData() {
    const searchTitle = document.getElementById("searchTitle")?.value?.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    // Check if required elements exist
    if (!resultsContainer) {
        console.error("Results container element not found");
        return;
    }

    // Clear previous results
    resultsContainer.innerHTML = "";

    // Validate search input
    if (!searchTitle || searchTitle.length === 0) {
        resultsContainer.innerHTML = "<p>Please enter a book title.</p>";
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = "<p>Searching...</p>";

    try {
        // Fetch more results to show multiple editions (limit=10)
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTitle)}&limit=10`);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if we have results
        if (data && 
            data.docs && 
            Array.isArray(data.docs) && 
            data.docs.length > 0) {
            
            // Create table structure
            let htmlContent = `
                <div class="results-header">
                    <h2>Search Results for "${searchTitle}"</h2>
                    <p>Found ${data.numFound} books, showing first ${data.docs.length}</p>
                </div>
                <div class="results-table">
                    <div class="table-header">
                        <div class="header-cell">Cover</div>
                        <div class="header-cell">Title</div>
                        <div class="header-cell">Author(s)</div>
                        <div class="header-cell">Publication Info</div>
                        <div class="header-cell">Edition Count</div>
                    </div>
            `;

            // Process each book result
            data.docs.forEach((book, index) => {
                // Safe property access with fallbacks
                const title = book.title && typeof book.title === 'string' && book.title.trim() 
                    ? book.title.trim() 
                    : "No title available";
                
                const author = book.author_name && 
                              Array.isArray(book.author_name) && 
                              book.author_name.length > 0
                    ? book.author_name
                        .filter(name => name && typeof name === 'string' && name.trim())
                        .slice(0, 3) // Limit to first 3 authors
                        .join(", ")
                    : "Unknown author";
                
                // Handle multiple possible date fields
                let publishInfo = "Date unknown";
                if (book.first_publish_year) {
                    publishInfo = `First published: ${book.first_publish_year}`;
                } else if (book.publish_year && Array.isArray(book.publish_year) && book.publish_year.length > 0) {
                    const years = book.publish_year.filter(year => year && !isNaN(year)).sort();
                    if (years.length > 0) {
                        publishInfo = years.length === 1 
                            ? `Published: ${years[0]}` 
                            : `Published: ${years[0]} - ${years[years.length - 1]}`;
                    }
                } else if (book.publish_date && Array.isArray(book.publish_date) && book.publish_date.length > 0) {
                    const dates = book.publish_date.filter(date => date && typeof date === 'string');
                    if (dates.length > 0) {
                        publishInfo = `Published: ${dates[0]}`;
                    }
                }
                
                const editionCount = book.edition_count || 1;
                
                // Handle cover image
                const coverId = book.cover_i && 
                               (typeof book.cover_i === 'number' || typeof book.cover_i === 'string') && 
                               book.cover_i.toString().trim()
                    ? book.cover_i
                    : null;

                const coverHtml = coverId 
                    ? `<img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg" 
                           alt="Cover of ${title}" 
                           class="book-cover"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                       <div class="no-cover" style="display:none;">No Cover</div>`
                    : `<div class="no-cover">No Cover</div>`;

                // Add row to table
                htmlContent += `
                    <div class="table-row" data-index="${index}">
                        <div class="table-cell cover-cell">
                            ${coverHtml}
                        </div>
                        <div class="table-cell title-cell">
                            <strong>${title}</strong>
                        </div>
                        <div class="table-cell author-cell">
                            ${author}
                        </div>
                        <div class="table-cell date-cell">
                            ${publishInfo}
                        </div>
                        <div class="table-cell edition-cell">
                            ${editionCount} edition${editionCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                `;
            });

            htmlContent += `</div>`;
            resultsContainer.innerHTML = htmlContent;
            
        } else {
            // No results found
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No books found</h3>
                    <p>Try a different search term or check your spelling.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Fetch error:", error);
        
        // Provide more specific error messages
        let errorMessage = "Error fetching data. Please try again.";
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes('HTTP error')) {
            errorMessage = "Server error. Please try again later.";
        } else if (error.name === 'SyntaxError') {
            errorMessage = "Invalid response from server.";
        }
        
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${errorMessage}</p>
            </div>
        `;
    }
}