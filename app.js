document.addEventListener("DOMContentLoaded", () => {
    const bookmarksContainer = document.getElementById("bookmarks-container");
    const searchBar = document.getElementById("search-bar");
    let allBookmarks = []; // To store the original list of bookmarks

    // 1. Fetch the bookmarks data
    fetch("bookmarks.json")
        .then(response => response.json())
        .then(data => {
            allBookmarks = data; // Store the full list
            renderBookmarks(allBookmarks); // Render the initial full list
        })
        .catch(error => {
            console.error("Error fetching bookmarks:", error);
            bookmarksContainer.innerHTML = "<p>Failed to load bookmarks.</p>";
        });

    // 2. Add search/filter functionality
    searchBar.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();

        const filteredBookmarks = allBookmarks.filter(bookmark => {
            const titleMatch = bookmark.title.toLowerCase().includes(query);
            const descriptionMatch = bookmark.description.toLowerCase().includes(query);
            const tagMatch = bookmark.tags.some(tag => tag.toLowerCase().includes(query));
            
            return titleMatch || descriptionMatch || tagMatch;
        });

        renderBookmarks(filteredBookmarks);
    });

    // 3. Function to render the bookmarks to the page
    function renderBookmarks(bookmarks) {
        // Clear the container first
        bookmarksContainer.innerHTML = "";

        if (bookmarks.length === 0) {
            bookmarksContainer.innerHTML = "<p>No bookmarks found.</p>";
            return;
        }

        // Create and append a card for each bookmark
        bookmarks.forEach(bookmark => {
            const card = document.createElement("article");
            card.className = "bookmark-card";

            // Create tag elements
            const tagsHTML = bookmark.tags
                .map(tag => `<span class="tag">${tag}</span>`)
                .join("");

            // Set the inner HTML of the card
            card.innerHTML = `
                <div class="bookmark-content">
                    <h2>
                        <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">
                            ${bookmark.title}
                        </a>
                    </h2>
                    <p>${bookmark.description}</p>
                </div>
                <div class="bookmark-tags">
                    ${tagsHTML}
                </div>
            `;

            bookmarksContainer.appendChild(card);
        });
    }
});