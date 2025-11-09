document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const bookmarksContainer = document.getElementById("bookmarks-container");
    const searchBar = document.getElementById("search-bar");
    
    // App State
    let allBookmarks = [];
    let pinnedUrls = []; // We still keep this for user preference
    let currentQuery = "";

    // --- LocalStorage Helper Functions ---

    function getFromStorage(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return defaultValue;
        }
    }

    function saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Error saving to localStorage", e);
        }
    }

    // --- Core App Logic ---

    // 1. Initialize the app
    function initializeApp() {
        // Load state from localStorage
        pinnedUrls = getFromStorage("pinnedUrls", []);

        // Fetch master list from our JSON file
        fetch("bookmarks.json")
            .then(response => response.json())
            .then(masterBookmarks => {
                allBookmarks = masterBookmarks;
                renderApp();
            })
            .catch(error => {
                console.error("Error fetching bookmarks:", error);
                bookmarksContainer.innerHTML = "<p>Failed to load bookmarks.</p>";
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

        // Pinning (uses event delegation)
        bookmarksContainer.addEventListener("click", (e) => {
            // Check if the click is on the button or its path
            const pinButton = e.target.closest('.pin-btn');
            if (pinButton) {
                const url = pinButton.dataset.url;
                togglePin(url);
            }
        });
    }

    // 3. Render the entire application (filter, sort, and display)
    function renderApp() {
        // Filter based on search query
        const filteredBookmarks = allBookmarks.filter(bookmark => {
            const query = currentQuery;
            const titleMatch = bookmark.title.toLowerCase().includes(query);
            const descriptionMatch = (bookmark.description || "").toLowerCase().includes(query);
            // Ensure bookmark.tags exists before calling .some
            const tagMatch = Array.isArray(bookmark.tags) && bookmark.tags.some(tag => tag.toLowerCase().includes(query));
            return titleMatch || descriptionMatch || tagMatch;
        });

        // Separate pinned from unpinned
        const isPinned = (bookmark) => bookmark.pinned || pinnedUrls.includes(bookmark.url);
        
        const pinnedItems = filteredBookmarks.filter(isPinned);
        const unpinnedItems = filteredBookmarks.filter(b => !isPinned(b));
        
        // Render the HTML
        renderBookmarks(pinnedItems, unpinnedItems);
    }

    // 4. Function to create and display HTML for bookmarks
    function renderBookmarks(pinnedItems, unpinnedItems) {
        bookmarksContainer.innerHTML = ""; // Clear container

        if (pinnedItems.length === 0 && unpinnedItems.length === 0) {
            bookmarksContainer.innerHTML = "<p>No bookmarks found.</p>";
            return;
        }

        // Render Pinned Section
        if (pinnedItems.length > 0) {
            bookmarksContainer.appendChild(createBookmarkSection(pinnedItems, "Pinned"));
        }

        // Render All Section
        if (unpinnedItems.length > 0) {
            bookmarksContainer.appendChild(createBookmarkSection(unpinnedItems, "All"));
        }
    }

    // 5. Helper to create a whole section (title + grid)
    function createBookmarkSection(items, title) {
        const sectionEl = document.createElement("section");
        sectionEl.className = "bookmarks-section";
        
        const titleEl = document.createElement("h2");
        titleEl.className = "bookmarks-section-title";
        titleEl.textContent = title;
        sectionEl.appendChild(titleEl);

        const gridEl = document.createElement("div");
        gridEl.className = "bookmarks-grid";
        
        items.forEach(bookmark => {
            gridEl.appendChild(createBookmarkCard(bookmark));
        });
        
        sectionEl.appendChild(gridEl);
        return sectionEl;
    }

    // 6. Helper to create a single bookmark card
    function createBookmarkCard(bookmark) {
        const card = document.createElement("article");
        const isUserPinned = pinnedUrls.includes(bookmark.url);
        const isMasterPinned = bookmark.pinned;
        const isCurrentlyPinned = isUserPinned || isMasterPinned;

        card.className = "bookmark-card";
        if (isCurrentlyPinned) card.classList.add("pinned");

        // Handle tags, ensuring it's an array
        const tags = Array.isArray(bookmark.tags) ? bookmark.tags : [];
        const tagsHTML = tags
            .map(tag => `<span class="tag">${tag}</span>`)
            .join("");
        
        card.innerHTML = `
            <button class="pin-btn" data-url="${bookmark.url}" title="Pin item">📌</button>
            <div class="bookmark-content">
                <h2>
                    <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">
                        ${bookmark.title}
                    </a>
                </h2>
                <p>${bookmark.description || ""}</p>
            </div>
            <div class="bookmark-tags">
                ${tagsHTML}
            </div>
        `;
        return card;
    }

    // --- Event Handlers ---

    // 7. Handle Pin Toggle
    function togglePin(url) {
        const index = pinnedUrls.indexOf(url);
        if (index > -1) {
            // It's pinned, unpin it
            pinnedUrls.splice(index, 1);
        } else {
            // It's not pinned, pin it
            pinnedUrls.push(url);
        }
        
        saveToStorage("pinnedUrls", pinnedUrls); // Save changes
        renderApp(); // Re-render
    }
    
    // --- All 'add', 'export', and 'clear' functions have been removed ---

    // --- Start the App ---
    initializeApp();
});