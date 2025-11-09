document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const bookmarksContainer = document.getElementById("bookmarks-container");
    const searchBar = document.getElementById("search-bar");
    
    // App State
    let allBookmarks = [];
    let currentQuery = "";

    // --- Core App Logic ---

    // 1. Initialize the app
    function initializeApp() {
        // Fetch master list from our JSON file
        fetch("bookmarks.json")
            .then(response => response.json())
            .then(masterBookmarks => {
                // Ensure we start with an array, even if the file is empty
                allBookmarks = Array.isArray(masterBookmarks) ? masterBookmarks : [];
                renderApp();
            })
            .catch(error => {
                console.error("Error fetching bookmarks:", error);
                bookmarksContainer.innerHTML = "<p>Failed to load bookmarks. Check console for details.</p>";
            });

        // Setup Event Listeners
        setupEventListeners();
    }

    // 2. Setup all event listeners
    function setupEventListeners() {
        // Search
        searchBar.addEventListener("input", (e) => {
            currentQuery = e.target.value.toLowerCase();
            renderApp();
        });
        
        // Removed: Click handler for pinning
    }

    // 3. Render the entire application (filter and display)
    function renderApp() {
        // Filter based on search query (only checks title and description now)
        const filteredBookmarks = allBookmarks.filter(bookmark => {
            const query = currentQuery;
            const titleMatch = bookmark.title.toLowerCase().includes(query);
            const descriptionMatch = (bookmark.description || "").toLowerCase().includes(query);
            return titleMatch || descriptionMatch;
        });

        renderBookmarks(filteredBookmarks);
    }

    // 4. Function to create and display HTML for bookmarks
    function renderBookmarks(items) {
        bookmarksContainer.innerHTML = ""; // Clear container

        if (items.length === 0) {
            bookmarksContainer.innerHTML = "<p>No quick links found matching your search.</p>";
            return;
        }
        
        // Render All Section
        const sectionEl = document.createElement("section");
        sectionEl.className = "bookmarks-section";
        
        const gridEl = document.createElement("div");
        gridEl.className = "bookmarks-grid";
        
        items.forEach(bookmark => {
            gridEl.appendChild(createBookmarkCard(bookmark));
        });
        
        sectionEl.appendChild(gridEl);
        bookmarksContainer.appendChild(sectionEl);
    }

    // 5. Helper to create a single bookmark card
    function createBookmarkCard(bookmark) {
        const card = document.createElement("article");
        card.className = "bookmark-card";

        // Removed: Pin button and tags section
        
        card.innerHTML = `
            <div class="bookmark-content">
                <h2>
                    <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">
                        ${bookmark.title}
                    </a>
                </h2>
                <p>${bookmark.description || ""}</p>
            </div>
        `;
        return card;
    }
    
    // --- Start the App ---
    initializeApp();
});