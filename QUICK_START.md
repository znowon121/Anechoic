# Quick Start: Using History & Bookmarks API

## 1️⃣ Adding a Bookmark (Quick Example)

```javascript
async function addBookmark() {
  const result = await window.anechoicAPI.addBookmark({
    title: "My Site",
    url: "https://example.com"
  });
  
  if (result.ok) {
    console.log("✅ Bookmark added!");
  } else {
    console.log("❌ Error:", result.error);
  }
}
```

## 2️⃣ Getting All Bookmarks

```javascript
async function displayBookmarks() {
  const result = await window.anechoicAPI.getBookmarks();
  
  if (result.ok) {
    result.data.forEach(bookmark => {
      console.log(`📌 ${bookmark.title}: ${bookmark.url}`);
    });
  }
}
```

## 3️⃣ Removing a Bookmark

```javascript
async function deleteBookmark(url) {
  const result = await window.anechoicAPI.removeBookmark(url);
  
  if (result.ok) {
    console.log("✅ Bookmark removed!");
  }
}
```

## 4️⃣ Getting History

```javascript
async function showHistory() {
  const result = await window.anechoicAPI.getHistory();
  
  if (result.ok) {
    result.data.slice(0, 10).forEach(entry => {
      console.log(`🔗 ${entry.title}\n   ${entry.url}\n   At: ${entry.timestamp}\n`);
    });
  }
}
```

---

## HTML Button Example

```html
<button onclick="addCurrentPage()">⭐ Bookmark This</button>
<button onclick="showHistory()">📜 Show History</button>
<button onclick="showBookmarks()">📌 Show Bookmarks</button>

<ul id="historyList"></ul>
<ul id="bookmarksList"></ul>
```

```javascript
async function addCurrentPage() {
  const title = document.title;
  const url = window.location.href;
  
  const result = await window.anechoicAPI.addBookmark({ title, url });
  
  if (result.ok) {
    alert("✅ Added to bookmarks!");
  } else {
    alert("❌ " + result.error);
  }
}

async function showHistory() {
  const result = await window.anechoicAPI.getHistory();
  
  if (result.ok) {
    const html = result.data.map(entry => 
      `<li>
        <a href="${entry.url}">${entry.title}</a>
        <small>${new Date(entry.timestamp).toLocaleString()}</small>
      </li>`
    ).join('');
    
    document.getElementById('historyList').innerHTML = html;
  }
}

async function showBookmarks() {
  const result = await window.anechoicAPI.getBookmarks();
  
  if (result.ok) {
    const html = result.data.map(bookmark => 
      `<li>
        <a href="${bookmark.url}">${bookmark.title}</a>
        <button onclick="removeBookmark('${bookmark.url}')">❌</button>
      </li>`
    ).join('');
    
    document.getElementById('bookmarksList').innerHTML = html;
  }
}

async function removeBookmark(url) {
  if (confirm("Remove this bookmark?")) {
    const result = await window.anechoicAPI.removeBookmark(url);
    if (result.ok) {
      showBookmarks(); // Refresh
    }
  }
}
```

---

## 📋 API Methods

| Method | Usage | Response |
|--------|-------|----------|
| `getHistory()` | `await window.anechoicAPI.getHistory()` | `{ok, data: [entries]}` |
| `getBookmarks()` | `await window.anechoicAPI.getBookmarks()` | `{ok, data: [bookmarks]}` |
| `addBookmark({title, url})` | `await window.anechoicAPI.addBookmark({...})` | `{ok, data: [...]}` |
| `removeBookmark(url)` | `await window.anechoicAPI.removeBookmark(url)` | `{ok, data: [...]}` |

---

## 💾 Where Data is Stored

Data files are automatically saved to:
- **Windows**: `%APPDATA%/YourAppName/`
- **macOS**: `~/Library/Application Support/YourAppName/`
- **Linux**: `~/.config/YourAppName/`

Files:
- `history.json` - Navigation history
- `bookmarks.json` - Your bookmarks

---

## ⚠️ Error Handling Pattern

All methods return `{ ok, data, error }`:

```javascript
async function safeCall() {
  try {
    const result = await window.anechoicAPI.getBookmarks();
    
    if (result.ok) {
      // Success: use result.data
      console.log(result.data);
    } else {
      // Failed: show result.error
      console.error("Error:", result.error);
    }
  } catch (err) {
    // Unexpected error
    console.error("Unexpected error:", err);
  }
}
```

---

## 🔍 Debug Tips

```javascript
// Check if API is available
console.log(window.anechoicAPI);

// Log all bookmarks to console
await window.anechoicAPI.getBookmarks().then(r => console.log(r));

// Check file location
const fs = require('fs');
const path = require('path');
const userDataPath = require('electron').app.getPath('userData');
console.log(userDataPath);
```

---

## ✅ Checklist

- [x] History automatically tracks navigation
- [x] Localhost & file:// URLs are excluded
- [x] Duplicates are removed (latest first)
- [x] Max 100 history items
- [x] Bookmarks can be added/removed/listed
- [x] Duplicate bookmarks prevented
- [x] All data persisted to JSON files
- [x] Secure API bridge via contextBridge
- [x] Error handling on all operations

---

For more details, see [HISTORY_BOOKMARKS_API.md](HISTORY_BOOKMARKS_API.md)
