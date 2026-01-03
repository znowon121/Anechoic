# Testing Guide: History & Bookmarks Frontend Integration

## 🚀 Quick Start Testing

### Step 1: Start the Application
```bash
cd "c:\Users\Administrator\Desktop\IT Project v1.2\IT Project"
npm start --dev
```

The `--dev` flag opens DevTools automatically so you can monitor the console.

---

## ✅ Test 1: Verify API is Available

**What to check:**
1. Open DevTools: **F12** or **Ctrl+Shift+I**
2. Go to **Console** tab
3. Look for a green checkmark message

**Expected output:**
```
✅ anechoicAPI is available: {getHistory, getBookmarks, addBookmark, removeBookmark}
```

**❌ If you see:**
```
❌ anechoicAPI is NOT available
```

This means the preload.js file is not properly exposing the API. Check:
- preload.js is being loaded (check electron-main.js)
- contextBridge is working
- No syntax errors in preload.js

---

## ✅ Test 2: History Auto-Tracking

**What to do:**
1. Start app with `npm start --dev`
2. Navigate to 3-5 websites:
   - `https://google.com`
   - `https://github.com`
   - `https://wikipedia.org`
3. Check DevTools console for messages like:
   ```
   History updated: https://google.com
   History updated: https://github.com
   ```

**Expected behavior:**
- Each navigation logs "History updated"
- Localhost URLs are NOT logged
- File:// protocol URLs are NOT logged

**Verify with JSON file:**
1. Open file manager
2. Navigate to:
   - Windows: `%APPDATA%/YourAppName/history.json`
   - macOS: `~/Library/Application Support/YourAppName/history.json`
   - Linux: `~/.config/YourAppName/history.json`
3. Open `history.json`
4. Should see entries like:
```json
[
  {
    "title": "GitHub",
    "url": "https://github.com",
    "timestamp": "2026-01-03T10:30:45.123Z"
  },
  {
    "title": "Wikipedia",
    "url": "https://wikipedia.org",
    "timestamp": "2026-01-03T10:30:42.456Z"
  }
]
```

---

## ✅ Test 3: View History

**What to do:**
1. After navigating to several sites (Test 2)
2. Click **History** in the left sidebar
3. A modal should open with history entries

**Expected behavior:**
- ✅ Modal shows "Loading history..." briefly
- ✅ History appears as a list
- ✅ Each entry shows URL, title, and timestamp
- ✅ Newest entries appear at the top
- ✅ Search box works (filter by URL or title)
- ✅ "No history found" message appears if search has no results

**🧪 Test Search:**
1. Type "git" in search box
2. Should filter to GitHub entry only
3. Clear search
4. All entries should reappear

---

## ✅ Test 4: Add Bookmark

**What to do:**
1. Navigate to a website: `https://github.com`
2. Look in the navigation bar (top of browser)
3. Find the **Bookmark icon** (star shape) next to the reload button
4. Click the bookmark button

**Expected behavior:**
- ✅ Alert appears: `✅ Bookmark saved!`
- ✅ No errors in console
- ✅ bookmarks.json is created/updated

**Verify with JSON file:**
1. Navigate to userData folder
2. Open `bookmarks.json`
3. Should contain:
```json
[
  {
    "title": "GitHub",
    "url": "https://github.com",
    "addedAt": "2026-01-03T10:32:15.789Z"
  }
]
```

---

## ✅ Test 5: View Bookmarks

**What to do:**
1. After adding bookmarks (Test 4)
2. Click **Bookmarks** in the left sidebar
3. A modal should open

**Expected behavior:**
- ✅ Modal shows "Loading bookmarks..." briefly
- ✅ Bookmarks appear as a list
- ✅ Each entry shows title and URL
- ✅ Search box works (filter by title or URL)
- ✅ Hover over a bookmark reveals X button
- ✅ "No bookmarks found" message appears if search has no results

**🧪 Test Search:**
1. Add 2-3 bookmarks (GitHub, Wikipedia, Google)
2. Type "wiki" in search box
3. Should filter to Wikipedia only
4. Clear search
5. All bookmarks should reappear

---

## ✅ Test 6: Remove Bookmark

**What to do:**
1. Open Bookmarks modal
2. Hover over a bookmark entry
3. An X button should appear
4. Click the X button

**Expected behavior:**
- ✅ Bookmark disappears from list
- ✅ bookmarks.json is updated
- ✅ Modal refreshes automatically
- ✅ No alert appears (silent removal)

**Verify with JSON file:**
1. Open `bookmarks.json`
2. Bookmark should be removed

---

## ✅ Test 7: Duplicate Bookmark Prevention

**What to do:**
1. Navigate to a website: `https://google.com`
2. Click bookmark button
3. Alert: `✅ Bookmark saved!`
4. Click bookmark button again (same URL)

**Expected behavior:**
- ✅ Alert appears: `❌ Bookmark already exists`
- ✅ bookmarks.json is NOT modified
- ✅ Only one copy of the bookmark exists

---

## ✅ Test 8: History Limit (Max 100 items)

**What to do:**
1. Add 120 history entries somehow
   - Manual testing: Navigate to many sites
   - OR: Edit history.json and add mock data
2. Open history.json

**Expected behavior:**
- ✅ File contains exactly 100 entries (oldest removed)
- ✅ Only most recent 100 items preserved

---

## ✅ Test 9: Empty State Messages

### Empty History
1. Clear/delete history.json
2. Open History modal
3. Message: "No history found"

### Empty Bookmarks
1. Clear/delete bookmarks.json
2. Open Bookmarks modal
3. Message: "No bookmarks found"

---

## ✅ Test 10: Error Handling

### Bookmark with no page
1. Start fresh (don't navigate)
2. Try to click bookmark button
3. Alert: "No page to bookmark"

### Bookmarking localhost
1. Start a local server on localhost:3000
2. Navigate to it
3. Try to bookmark
4. Should NOT appear in history.json (filtered out)
5. CAN be bookmarked manually

---

## 🔍 Console Testing

**You can also test directly in DevTools Console:**

```javascript
// Test 1: Check API exists
window.anechoicAPI

// Test 2: Get all history
await window.anechoicAPI.getHistory()

// Test 3: Get all bookmarks
await window.anechoicAPI.getBookmarks()

// Test 4: Add a bookmark
await window.anechoicAPI.addBookmark({
  title: "My Test",
  url: "https://example.com"
})

// Test 5: Remove a bookmark
await window.anechoicAPI.removeBookmark("https://example.com")
```

**Expected console output:**
```javascript
// For getHistory():
{ok: true, data: Array(3)}
  data: [
    {title: "GitHub", url: "https://github.com", timestamp: "2026-01-03T10:30:45.123Z"},
    ...
  ]
  ok: true

// For addBookmark():
{ok: true, data: Array(1)}
  data: [{title: "My Test", url: "https://example.com", addedAt: "..."}]
  ok: true

// For addBookmark (duplicate):
{ok: false, error: "Bookmark already exists"}
```

---

## 🐛 Debugging Tips

### Enable detailed logging
Add to index.html App component:
```javascript
useEffect(() => {
    window.anechoicAPI.getHistory().then(r => {
        console.log('History:', r);
    });
}, []);
```

### Check file permissions
```bash
# Windows
dir %APPDATA%\YourAppName\history.json
dir %APPDATA%\YourAppName\bookmarks.json

# macOS/Linux
ls -la ~/Library/Application\ Support/YourAppName/
ls -la ~/.config/YourAppName/
```

### Check IPC communication
In DevTools:
1. Open **Console**
2. Set breakpoint in addBookmark function
3. Step through execution
4. Verify result object

### Monitor file changes
Use a file watcher to see when JSON files are updated:
```bash
# Windows (PowerShell)
$path = "$env:APPDATA\YourAppName"
Get-Item $path -Include "*.json" | ForEach-Object { Write-Host $_.LastWriteTime $_.Name }
```

---

## ✅ Complete Test Checklist

- [ ] API verification message appears in console
- [ ] Navigating to websites creates history entries
- [ ] history.json file is created and contains entries
- [ ] History modal loads and displays entries
- [ ] History search works
- [ ] Add bookmark button is visible in navbar
- [ ] Bookmarks can be added successfully
- [ ] bookmarks.json file is created and updated
- [ ] Bookmarks modal loads and displays bookmarks
- [ ] Bookmarks search works
- [ ] Bookmarks can be removed with X button
- [ ] Duplicate bookmarks are prevented
- [ ] UI styling is not broken
- [ ] No console errors
- [ ] No IPC errors
- [ ] File system operations succeed

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________
App Version: _______________

Test Results:
✅ Test 1 (API Verification): PASS / FAIL
✅ Test 2 (History Auto-Tracking): PASS / FAIL
✅ Test 3 (View History): PASS / FAIL
✅ Test 4 (Add Bookmark): PASS / FAIL
✅ Test 5 (View Bookmarks): PASS / FAIL
✅ Test 6 (Remove Bookmark): PASS / FAIL
✅ Test 7 (Duplicate Prevention): PASS / FAIL
✅ Test 8 (History Limit): PASS / FAIL
✅ Test 9 (Empty States): PASS / FAIL
✅ Test 10 (Error Handling): PASS / FAIL

Issues Found:
1. ...
2. ...

Notes:
...
```

---

**Status:** 🟢 Ready for Testing  
**Date:** January 3, 2026
