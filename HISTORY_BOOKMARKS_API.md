# History & Bookmarks API Documentation

This document describes how to use the History and Bookmarks features in the Electron application.

## Overview

The application now has two main features:
1. **History** - Automatically tracks navigation history
2. **Bookmarks** - Manual bookmarking of pages

Both features use JSON-based storage in the user's application data directory.

---

## History Feature

### Automatic Recording
History is automatically recorded when the user navigates to a page. Each history entry contains:
- `title` - Page title
- `url` - Page URL
- `timestamp` - ISO 8601 timestamp of the visit

### Filtering
The following URLs are **NOT** saved to history:
- `file://` protocol URLs
- Localhost URLs (e.g., `http://localhost:*`, `http://127.0.0.1:*`)

### Storage Limits
- Maximum of **100 items** in history
- Duplicates are removed (latest visit is moved to top)

### Usage in Frontend

```javascript
// Get all history entries
const result = await window.anechoicAPI.getHistory();
if (result.ok) {
  console.log(result.data); // Array of history entries
} else {
  console.error(result.error);
}
```

### API Response Format

```javascript
{
  ok: true,
  data: [
    {
      title: "GitHub",
      url: "https://github.com",
      timestamp: "2026-01-03T10:30:45.123Z"
    },
    // ... more entries
  ]
}
```

---

## Bookmarks Feature

### Adding Bookmarks

```javascript
const result = await window.anechoicAPI.addBookmark({
  title: "My Favorite Site",
  url: "https://example.com"
});

if (result.ok) {
  console.log("Bookmark added:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Removing Bookmarks

```javascript
const result = await window.anechoicAPI.removeBookmark("https://example.com");

if (result.ok) {
  console.log("Bookmark removed:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Getting All Bookmarks

```javascript
const result = await window.anechoicAPI.getBookmarks();

if (result.ok) {
  console.log(result.data); // Array of bookmarks
} else {
  console.error(result.error);
}
```

### API Response Format

```javascript
{
  ok: true,
  data: [
    {
      title: "GitHub",
      url: "https://github.com",
      addedAt: "2026-01-03T10:30:45.123Z"
    },
    // ... more bookmarks
  ]
}
```

### Bookmark Validation
- Each bookmark must have a unique URL
- Attempting to add a duplicate URL will fail with error: "Bookmark already exists"
- Bookmarks are stored in insertion order (newest first)

---

## API Reference

### window.anechoicAPI

All methods are async and return an object with `{ ok, data, error }` structure.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getHistory()` | None | Promise<{ok, data}> | Get all history entries |
| `getBookmarks()` | None | Promise<{ok, data}> | Get all bookmarks |
| `addBookmark(data)` | {title, url} | Promise<{ok, data}> | Add a new bookmark |
| `removeBookmark(url)` | url (string) | Promise<{ok, data}> | Remove a bookmark by URL |

---

## Data Storage

### File Locations

Both JSON files are stored in the user's application data directory:
- **Windows**: `%APPDATA%/Your-App-Name/`
- **macOS**: `~/Library/Application Support/Your-App-Name/`
- **Linux**: `~/.config/Your-App-Name/`

### File Names
- `history.json` - Contains navigation history
- `bookmarks.json` - Contains bookmarks

### Data Format

**history.json:**
```json
[
  {
    "title": "Page Title",
    "url": "https://example.com",
    "timestamp": "2026-01-03T10:30:45.123Z"
  }
]
```

**bookmarks.json:**
```json
[
  {
    "title": "Bookmark Title",
    "url": "https://example.com",
    "addedAt": "2026-01-03T10:30:45.123Z"
  }
]
```

---

## Error Handling

All API methods return standardized error responses:

```javascript
{
  ok: false,
  error: "Error message describing what went wrong"
}
```

Common errors:
- "URL is required" - Missing or invalid URL parameter
- "Invalid bookmark data" - Malformed bookmark object
- "Bookmark already exists" - Attempting to add duplicate URL
- File I/O errors - Rare, indicates disk permission issues

---

## Example Usage

```html
<!-- HTML -->
<button id="getHistoryBtn">Show History</button>
<button id="getBookmarksBtn">Show Bookmarks</button>
<input type="text" id="bookmarkTitle" placeholder="Title">
<input type="text" id="bookmarkUrl" placeholder="URL">
<button id="addBookmarkBtn">Add Bookmark</button>
<ul id="historyList"></ul>
<ul id="bookmarksList"></ul>
```

```javascript
// JavaScript
document.getElementById('getHistoryBtn').addEventListener('click', async () => {
  const result = await window.anechoicAPI.getHistory();
  if (result.ok) {
    const html = result.data.map(item => 
      `<li>${item.title} - ${item.url}</li>`
    ).join('');
    document.getElementById('historyList').innerHTML = html;
  }
});

document.getElementById('addBookmarkBtn').addEventListener('click', async () => {
  const title = document.getElementById('bookmarkTitle').value;
  const url = document.getElementById('bookmarkUrl').value;
  
  if (!title || !url) {
    alert('Please enter both title and URL');
    return;
  }

  const result = await window.anechoicAPI.addBookmark({ title, url });
  if (result.ok) {
    alert('Bookmark added successfully!');
    // Refresh bookmarks list
    document.getElementById('getBookmarksBtn').click();
  } else {
    alert('Error: ' + result.error);
  }
});

document.getElementById('getBookmarksBtn').addEventListener('click', async () => {
  const result = await window.anechoicAPI.getBookmarks();
  if (result.ok) {
    const html = result.data.map(item => 
      `<li>${item.title} - ${item.url} 
        <button onclick="removeBookmark('${item.url}')">Delete</button>
       </li>`
    ).join('');
    document.getElementById('bookmarksList').innerHTML = html;
  }
});

async function removeBookmark(url) {
  const result = await window.anechoicAPI.removeBookmark(url);
  if (result.ok) {
    document.getElementById('getBookmarksBtn').click(); // Refresh
  }
}
```

---

## Implementation Details

### Data Persistence
- Uses native Node.js `fs` and `path` modules
- No external dependencies required
- JSON files are created automatically if they don't exist
- Graceful error handling for file I/O operations

### Security
- Uses `contextBridge` to isolate main process from renderer
- All file operations are in the main process only
- Renderer process cannot access filesystem directly
- IPC communication is validated on both sides

### Performance
- Entire file is read/written on each operation (suitable for < 1000 items)
- Consider implementing pagination or database if limits are exceeded
- History and bookmarks are independent, no shared state issues

---

## Future Enhancements

Possible improvements:
1. Add search/filtering capabilities for history and bookmarks
2. Implement categories or tags for bookmarks
3. Add export/import functionality (CSV, JSON)
4. Add a settings UI for managing storage limits
5. Migrate to SQLite for better scalability
6. Add sync across devices (cloud storage)
