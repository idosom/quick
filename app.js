document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const bookmarksContainer = document.getElementById("bookmarks-container");
    const searchBar = document.getElementById("search-bar");
    
    // Modal Elements
    const modalOverlay = document.getElementById("modal-overlay");
    const addBtn = document.getElementById("add-bookmark-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const addForm = document.getElementById("add-form");

    // Action Buttons
    const exportBtn = document.getElementById("export-btn");
    const clearLocalBtn = document.getElementById("clear-local-btn");
    
    // App State
    let allBookmarks = [];
    let userAddedBookmarks = [];
    let pinnedUrls = [];
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
        userAddedBookmarks = getFromStorage("userBookmarks", []);
        pinnedUrls = getFromStorage("pinnedUrls", []);

        // Fetch master list
        fetch("bookmarks.json")
            .then(response => response.json())
            .then(masterBookmarks => {
                // Combine master list with user's local list
                allBookmarks = [...masterBookmarks, ...userAddedBookmarks];
                renderApp();
            })
            .catch(error => {
                console.error("Error fetching bookmarks:", error);
                bookmarksContainer.innerHTML = "<p>Failed to load bookmarks. Using local-only.</p>";
                // Even if fetch fails, still load user's bookmarks
                allBookmarks = [...userAddedBookmarks];
                renderApp();
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
            if (e.target.classList.contains("pin-btn")) {
                const url = e.target.dataset.url;
                togglePin(url);
            }
        });

        // Modal Open/Close
        addBtn.addEventListener("click", () => modalOverlay.classList.remove("hidden"));
        cancelBtn.addEventListener("click", () => modalOverlay.classList.add("hidden"));
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add("hidden");
            }
        });

        // Add Bookmark Form
        addForm.addEventListener("submit", handleAddBookmark);

        // Action Buttons
        exportBtn.addEventListener("click", exportLocalBookmarks);
        clearLocalBtn.addEventListener("click", clearLocalData);
    }

    // 3. Render the entire application (filter, sort, and display)
    function renderApp() {
        // Filter based on search query
        const filteredBookmarks = allBookmarks.filter(bookmark => {
            const query = currentQuery;
            const titleMatch = bookmark.title.toLowerCase().includes(query);
            const descriptionMatch = (bookmark.description || "").toLowerCase().includes(query);
            const tagMatch = bookmark.tags.some(tag => tag.toLowerCase().includes(query));
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
        if (bookmark.isUserAdded) card.classList.add("user-added");

        const tagsHTML = bookmark.tags
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

    // 8. Handle New Bookmark Submission
    function handleAddBookmark(e) {
        e.preventDefault();
        
        const title = document.getElementById("title").value;
        const url = document.getElementById("url").value;
        const description = document.getElementById("description").value;
        const tags = document.getElementById("tags").value.split(",").map(t => t.trim()).filter(t => t);

        const newBookmark = {
            title,
            url,
            description,
            tags,
            pinned: false,
            isUserAdded: true // Flag to identify local-only items
        };

        // Add to our state
        userAddedBookmarks.push(newBookmark);
        allBookmarks.push(newBookmark);
        
        // Save to localStorage
        saveToStorage("userBookmarks", userAddedBookmarks);

        // Reset form and close modal
        addForm.reset();
        modalOverlay.classList.add("hidden");

        // Re-render
        renderApp();
    }

    // 9. Export only user-added bookmarks
    function exportLocalBookmarks() {
        if (userAddedBookmarks.length === 0) {
            alert("No locally-added bookmarks to export.");
            return;
        }

        const dataStr = JSON.stringify(userAddedBookmarks, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "user_bookmarks.json";
        a.click();
        URL.revokeObjectURL(url);
        
        alert("Your locally-added bookmarks have been downloaded. You can now copy the contents of 'user_bookmarks.json' into your main 'bookmarks.json' file.");
    }

    // 10. Clear all local data
    function clearLocalData() {
        if (confirm("Are you sure? This will delete all locally-added bookmarks and reset your pins. This cannot be undone.")) {
            localStorage.removeItem("userBookmarks");
            localStorage.removeItem("pinnedUrls");
            
            // Reload the app to its original state
            location.reload();
        }
    }

    // --- Start the App ---
    initializeApp();
});