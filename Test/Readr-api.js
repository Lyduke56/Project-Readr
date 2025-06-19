let searchResults = [];
let currentSearchTitle = '';

        async function fetchDataSearch() {
            const searchTitle = document.getElementById("searchTitle")?.value?.trim();
            const resultsContainer = document.getElementById("resultsContainer");
            const bookDetailsContainer = document.getElementById("bookDetailsContainer");
            const backBtn = document.getElementById("backBtn");

            // Hide book details and back button
            bookDetailsContainer.classList.remove("show");
            backBtn.style.display = "none";

            if (!resultsContainer) {
                console.error("Results container element not found");
                return;
            }

            resultsContainer.innerHTML = "";

            if (!searchTitle || searchTitle.length === 0) {
                resultsContainer.innerHTML = "<p>Please enter a book title.</p>";
                return;
            }

            currentSearchTitle = searchTitle;
            resultsContainer.innerHTML = '<div class="loading">Searching for books...</div>';

            try {
                const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTitle)}&limit=10`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                searchResults = data.docs;

                if (data && data.docs && Array.isArray(data.docs) && data.docs.length > 0) {
                    
                    let htmlContent = `
                        <div class="results-header">
                            <h2>Search Results for "${searchTitle}"</h2>
                            <p>Found ${data.numFound} books, showing first ${data.docs.length}. Click on any book to view details.</p>
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

                    data.docs.forEach((book, index) => {
                        const title = book.title && typeof book.title === 'string' && book.title.trim() 
                            ? book.title.trim() 
                            : "No title available";
                        
                        const author = book.author_name && 
                                      Array.isArray(book.author_name) && 
                                      book.author_name.length > 0
                            ? book.author_name
                                .filter(name => name && typeof name === 'string' && name.trim())
                                .slice(0, 3)
                                .join(", ")
                            : "Unknown author";
                        
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

                        htmlContent += `
                            <div class="table-row" data-index="${index}" onclick="fetchSelectedBook(${index})">
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
                    resultsContainer.innerHTML = `
                        <div class="no-results">
                            <h3>No books found</h3>
                            <p>Try a different search term or check your spelling.</p>
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error("Fetch error:", error);
                
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

        async function fetchSelectedBook(index) {
            const book = searchResults[index];
            const resultsContainer = document.getElementById("resultsContainer");
            const bookDetailsContainer = document.getElementById("bookDetailsContainer");
            const backBtn = document.getElementById("backBtn");

            if (!book || !book.key) {
                console.error("No book data or key found for the selected index.");
                return;
            }

            // Hide search results and show loading for book details
            resultsContainer.style.display = "none";
            bookDetailsContainer.innerHTML = '<div class="loading">Loading book details...</div>';
            bookDetailsContainer.classList.add("show");
            backBtn.style.display = "block";

            const workKey = book.key;
            const url = `https://openlibrary.org${workKey}.json`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

                const bookDetails = await response.json();

                // Get additional info from the search result
                const title = bookDetails.title || book.title || "Unknown Title";
                const authors = book.author_name && Array.isArray(book.author_name) 
                    ? book.author_name.join(", ") 
                    : "Unknown Author";

                // Handle description
                let description = "No description available.";
                if (bookDetails.description) {
                    if (typeof bookDetails.description === 'string') {
                        description = bookDetails.description;
                    } else if (bookDetails.description.value) {
                        description = bookDetails.description.value;
                    }
                }

                // Publication info
                const firstPublishYear = book.first_publish_year || "Unknown";
                const editionCount = book.edition_count || 1;
                const subjects = bookDetails.subjects ? bookDetails.subjects.slice(0, 10).join(", ") : "Not specified";

                // Cover image
                const coverId = book.cover_i;
                const coverHtml = coverId 
                    ? `<img src="https://covers.openlibrary.org/b/id/${coverId}-L.jpg" 
                           alt="Cover of ${title}" 
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                       <div class="no-cover-large" style="display:none;">No Cover Available</div>`
                    : `<div class="no-cover-large">No Cover Available</div>`;

                const detailsHtml = `
                    <div class="book-detail-header">
                        <div class="book-detail-cover">
                            ${coverHtml}
                        </div>
                        <div class="book-detail-info">
                            <h1>${title}</h1>
                            <div class="authors">by ${authors}</div>
                            <div class="meta">
                                <div class="meta-item">
                                    <div class="label">First Published</div>
                                    <div class="value">${firstPublishYear}</div>
                                </div>
                                <div class="meta-item">
                                    <div class="label">Edition Count</div>
                                    <div class="value">${editionCount} edition${editionCount !== 1 ? 's' : ''}</div>
                                </div>
                                <div class="meta-item">
                                    <div class="label">Created</div>
                                    <div class="value">${bookDetails.created ? new Date(bookDetails.created.value).toLocaleDateString() : 'Unknown'}</div>
                                </div>
                                <div class="meta-item">
                                    <div class="label">Last Modified</div>
                                    <div class="value">${bookDetails.last_modified ? new Date(bookDetails.last_modified.value).toLocaleDateString() : 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="description">
                        <h3>📖 Description</h3>
                        <p>${description}</p>
                    </div>
                    ${subjects !== "Not specified" ? `
                        <div class="description" style="margin-top: 20px;">
                            <h3>🏷️ Subjects</h3>
                            <p>${subjects}</p>
                        </div>
                    ` : ''}
                `;

                bookDetailsContainer.innerHTML = detailsHtml;

            } catch (err) {
                console.error("Error fetching book details:", err);
                bookDetailsContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error Loading Book Details</h3>
                        <p>Unable to load detailed information for this book. Please try again.</p>
                    </div>
                `;
            }
        }

        function showSearchResults() {
            const resultsContainer = document.getElementById("resultsContainer");
            const bookDetailsContainer = document.getElementById("bookDetailsContainer");
            const backBtn = document.getElementById("backBtn");

            resultsContainer.style.display = "block";
            bookDetailsContainer.classList.remove("show");
            backBtn.style.display = "none";
        }

        // Allow Enter key to trigger search
        document.getElementById("searchTitle").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                fetchDataSearch();
            }
        });