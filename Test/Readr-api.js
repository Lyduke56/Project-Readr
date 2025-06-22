// Global variables
let searchResults = [];
let currentSearchTitle = '';
let currentPage = 1; // track current page number
let totalResults = 0; // track total number of results
let resultsPerPage = 10; // 10 per page for now
let currentFilter = 'All'; // Track current filter selection

const filterSelect = document.getElementById('filter');

// Handle filter changes
filterSelect.addEventListener('change', () => {
    const selectedValue = filterSelect.value;
    currentFilter = selectedValue;
    
    // Re-search with current filter if we have a search term
    if (currentSearchTitle) {
        fetchDataSearch(1); // Start from page 1 with new filter
    }
});

// fetch search results based on title and filter
async function fetchDataSearch(page = 1) {
    const searchTitle = document.getElementById("searchTitle")?.value?.trim();
    const resultsContainer = document.getElementById("resultsContainer");
    const bookDetailsContainer = document.getElementById("bookDetailsContainer");
    const backBtn = document.getElementById("backBtn");

    // hide book details and back button
    bookDetailsContainer.classList.remove("show");
    backBtn.style.display = "none";

    if (!resultsContainer) {
        console.error("Results container element not found");
        return;
    }

    // only clear and validate input on new searches (page 1)
    if (page === 1) {
        resultsContainer.innerHTML = "";

        if (!searchTitle || searchTitle.length === 0) {
            resultsContainer.innerHTML = "<p>Please enter a book title.</p>";
            return;
        }

        currentSearchTitle = searchTitle;
    }

    currentPage = page;
    resultsContainer.innerHTML = '<div class="loading">Searching for books...</div>';

    try {
        // offset pagination
        const offset = (page - 1) * resultsPerPage;
        
        // Build search URL based on filter selection
        let searchUrl;
        const encodedTitle = encodeURIComponent(currentSearchTitle);
        
        switch (currentFilter) {
            case 'Title':
                searchUrl = `https://openlibrary.org/search.json?title=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
                break;
            case 'Author':
                searchUrl = `https://openlibrary.org/search.json?author=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
                break;
            case 'Subject':
                searchUrl = `https://openlibrary.org/search.json?subject=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
                break;
            case 'Text':
                // Full text search - use 'q' parameter with specific syntax
                searchUrl = `https://openlibrary.org/search.json?q=${encodedTitle}&mode=everything&limit=${resultsPerPage}&offset=${offset}`;
                break;
            case 'Lists':
                // Search in lists - this might need different handling depending on API capabilities
                searchUrl = `https://openlibrary.org/search.json?q=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
                break;
            case 'All':
            default:
                // General search across all fields
                searchUrl = `https://openlibrary.org/search.json?q=${encodedTitle}&limit=${resultsPerPage}&offset=${offset}`;
                break;
        }

        const response = await fetch(searchUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        searchResults = data.docs;
        totalResults = data.numFound;

        if (data && data.docs && Array.isArray(data.docs) && data.docs.length > 0) {
            displayResults(data);
        } else if (page === 1) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No books found</h3>
                    <p>Try a different search term, filter option, or check your spelling.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Fetch error:", error);

        // error handling
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

// Display search results
function displayResults(data) {
    const resultsContainer = document.getElementById("resultsContainer");

    let htmlContent = `
        <div class="results-header">
            <h2>Search Results for "${currentSearchTitle}" (${currentFilter})</h2>
            <p>Found ${totalResults.toLocaleString()} books total, showing ${((currentPage - 1) * resultsPerPage) + 1}-${Math.min(currentPage * resultsPerPage, totalResults)} on page ${currentPage}</p>
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
        // Safe property access with fallbacks
        const title = book.title?.trim() || "No title available";

        const author = Array.isArray(book.author_name) && book.author_name.length > 0
            ? book.author_name.filter(name => name?.trim()).slice(0, 3).join(", ")
            : "Unknown author";

        // Handle multiple possible date fields
        let publishInfo = "Date unknown";
        if (book.first_publish_year) {
            publishInfo = `First published: ${book.first_publish_year}`;
        } else if (Array.isArray(book.publish_year)) {
            const years = book.publish_year.filter(y => y && !isNaN(y)).sort();
            if (years.length > 0) {
                publishInfo = years.length === 1
                    ? `Published: ${years[0]}`
                    : `Published: ${years[0]} - ${years[years.length - 1]}`;
            }
        } else if (Array.isArray(book.publish_date)) {
            const dates = book.publish_date.filter(d => typeof d === 'string');
            if (dates.length > 0) {
                publishInfo = `Published: ${dates[0]}`;
            }
        }

        const editionCount = book.edition_count || 1;

        // Handle cover image
        const coverId = book.cover_i?.toString().trim() ? book.cover_i : null;
        const coverHtml = coverId
            ? `<img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg"
                     alt="Cover of ${title}" 
                     class="book-cover"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
               <div class="no-cover" style="display:none;">No Cover</div>`
            : `<div class="no-cover">No Cover</div>`;

        // Add row to table
        htmlContent += `
            <div class="table-row" data-index="${index}" onclick="fetchSelectedBook(${index})">
                <div class="table-cell cover-cell">${coverHtml}</div>
                <div class="table-cell title-cell"><strong>${title}</strong></div>
                <div class="table-cell author-cell">${author}</div>
                <div class="table-cell date-cell">${publishInfo}</div>
                <div class="table-cell edition-cell">${editionCount} edition${editionCount !== 1 ? 's' : ''}</div>
            </div>
        `;
    });

    htmlContent += `</div>`; // Close .results-table
    htmlContent += generatePagination();
    resultsContainer.innerHTML = htmlContent;
}

// Generate pagination HTML
function generatePagination() {
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    if (totalPages <= 1) return '';

    let paginationHtml = `
        <div class="pagination-container">
            <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
                ← Previous
            </button>
            <div class="page-numbers">
    `;

    // Ellipsis pagination logic
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHtml += `<span class="page-number" onclick="changePage(1)">1</span>`;
        if (startPage > 2) paginationHtml += `<span class="page-number ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</span>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHtml += `<span class="page-number ellipsis">...</span>`;
        paginationHtml += `<span class="page-number" onclick="changePage(${totalPages})">${totalPages}</span>`;
    }

    paginationHtml += `
            </div>
            <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
                Next →
            </button>
            <div class="pagination-info">Page ${currentPage} of ${totalPages.toLocaleString()}</div>
        </div>
    `;

    return paginationHtml;
}

// switch to different page
function changePage(page) {
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    if (page < 1 || page > totalPages || page === currentPage) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchDataSearch(page);
}

// Fetch detailed info of SELECTED BOOK
async function fetchSelectedBook(index) {
    const book = searchResults[index];
    const resultsContainer = document.getElementById("resultsContainer");
    const bookDetailsContainer = document.getElementById("bookDetailsContainer");
    const backBtn = document.getElementById("backBtn");

    if (!book || !book.key) {
        console.error("No book data or key found for the selected index.");
        return;
    }

    resultsContainer.style.display = "none";
    bookDetailsContainer.innerHTML = '<div class="loading">Loading book details...</div>';
    bookDetailsContainer.classList.add("show");
    backBtn.style.display = "block";

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const url = `https://openlibrary.org${book.key}.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const bookDetails = await response.json();

        const title = bookDetails.title || book.title || "Unknown Title";
        const authors = Array.isArray(book.author_name) ? book.author_name.join(", ") : "Unknown Author";

        let description = "No description available.";
        if (bookDetails.description) {
            description = typeof bookDetails.description === 'string'
                ? bookDetails.description
                : bookDetails.description.value;
        }

        const firstPublishYear = book.first_publish_year || "Unknown";
        const editionCount = book.edition_count || 1;
        const subjects = bookDetails.subjects ? bookDetails.subjects.slice(0, 10).join(", ") : "Not specified";

        const coverId = book.cover_i;
        const coverHtml = coverId
            ? `<img src="https://covers.openlibrary.org/b/id/${coverId}-L.jpg"
                     alt="Cover of ${title}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
               <div class="no-cover-large" style="display:none;">No Cover Available</div>`
            : `<div class="no-cover-large">No Cover Available</div>`;

        const detailsHtml = `
            <div class="book-detail-header">
                <div class="book-detail-cover">${coverHtml}</div>
                <div class="book-detail-info">
                    <h1>${title}</h1>
                    <div class="authors">by ${authors}</div>
                    <div class="meta">
                        <div class="meta-item"><div class="label">First Published</div><div class="value">${firstPublishYear}</div></div>
                        <div class="meta-item"><div class="label">Edition Count</div><div class="value">${editionCount} edition${editionCount !== 1 ? 's' : ''}</div></div>
                        <div class="meta-item"><div class="label">Created</div><div class="value">${bookDetails.created ? new Date(bookDetails.created.value).toLocaleDateString() : 'Unknown'}</div></div>
                        <div class="meta-item"><div class="label">Last Modified</div><div class="value">${bookDetails.last_modified ? new Date(bookDetails.last_modified.value).toLocaleDateString() : 'Unknown'}</div></div>
                    </div>
                </div>
            </div>
            <div class="description"><h3>📖 Description</h3><p>${description}</p></div>
            ${subjects !== "Not specified" ? `<div class="description" style="margin-top: 20px;"><h3>🏷️ Subjects</h3><p>${subjects}</p></div>` : ''}
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

// Return to search results view
function showSearchResults() {
    const resultsContainer = document.getElementById("resultsContainer");
    const bookDetailsContainer = document.getElementById("bookDetailsContainer");
    const backBtn = document.getElementById("backBtn");

    resultsContainer.style.display = "block";
    bookDetailsContainer.classList.remove("show");
    backBtn.style.display = "none";

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Enter key trigger for searching
document.getElementById("searchTitle").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        fetchDataSearch();
    }
});