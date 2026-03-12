const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 載入 .env（若存在），方便未來整合 Flask 等服務
try {
  require('dotenv').config();
} catch (e) {
  // dotenv 可能未安裝；略過但不阻止應用啟動
}

let mainWindow;
// let flaskProcess = null; // child process for Flask (Removed)
let chatWindow = null; // separate BrowserWindow for chatroom
let authWindow = null; // [新增]
let currentUser = 'guest'; // [新增] 追蹤當前使用者，預設為訪客

// [新增] 接收前端傳來的使用者名稱，切換資料夾身分
ipcMain.handle('auth:set-user', (event, username) => {
  currentUser = username || 'guest';
  console.log(`👤 Current user set to: ${currentUser}`);
  return { ok: true, user: currentUser };
});

// ============================================================================
// History & Bookmarks Storage Helper
// ============================================================================

/**
 * Get the path to the data file (history.json or bookmarks.json)
 */
function getDataFilePath(filename) {
  const userDataPath = app.getPath('userData');
  // [修改] 根據當前使用者動態產生檔名，例如 "Jacky_history.json" 或 "guest_history.json"
  const userFilename = `${currentUser}_${filename}`;
  return path.join(userDataPath, userFilename);
}

/**
 * Read JSON data from file, return empty array if file doesn't exist
 */
function readDataFile(filename) {
  const filePath = getDataFilePath(filename);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
  }
  return [];
}

/**
 * Write JSON data to file
 */
function writeDataFile(filename, data) {
  const filePath = getDataFilePath(filename);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// Read FLASK_URL (or FLASK_HOST/FLASK_PORT) from environment (dotenv already loaded earlier)
const FLASK_URL = process.env.FLASK_URL || `http://${process.env.FLASK_HOST || '127.0.0.1'}:${process.env.FLASK_PORT || '5000'}`;

// ============================================================================
// History Feature: Listen to navigation events and save to history.json
// ============================================================================

/**
 * Add entry to history
 * @param {string} title - Page title
 * @param {string} url - Page URL
 */
function addToHistory(title, url) {
  // Skip localhost and file:// protocols
  if (url && (url.startsWith('file://') || url.includes('localhost'))) {
    return;
  }

  const history = readDataFile('history.json');

  // Remove duplicate URL if it exists
  const filteredHistory = history.filter(item => item.url !== url);

  // Add new entry at the beginning
  const newEntry = {
    title: title || 'Unknown',
    url: url,
    timestamp: new Date().toISOString()
  };

  const updatedHistory = [newEntry, ...filteredHistory];

  // Keep only the latest 100 items
  const maxItems = 100;
  const limitedHistory = updatedHistory.slice(0, maxItems);

  writeDataFile('history.json', limitedHistory);
  console.log(`History updated: ${url}`);
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  const iconPath = path.join(__dirname, 'Browser', 'assets', 'icon.png');

  const windowOptions = {
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true  // 啟用 <webview> 標籤
    }
  };

  // 只有當 icon 真正存在時才傳入 icon 屬性，避免找不到檔案造成錯誤
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // 載入 Browser/index.html
  mainWindow.loadFile(path.join(__dirname, 'Browser', 'index.html'));

  // 開發模式下開啟 DevTools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC: open Chatroom in a separate BrowserWindow (creates window if needed)
ipcMain.handle('chatroom:open-window', async () => {
  try {
    // if already opened, focus and return
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.focus();
      return { ok: true };
    }

    // create new BrowserWindow for chatroom
    chatWindow = new BrowserWindow({
      width: 900,
      height: 700,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    // load Placeholder message instead of FLASK_URL
    chatWindow.loadURL('data:text/html,<h2>Chat Service Unavailable</h2><p>The backend chat service has been removed.</p>');

    chatWindow.on('closed', () => {
      chatWindow = null;
    });

    return { ok: true };
  } catch (e) {
    console.error('chatroom:open-window error', e);
    return { ok: false, error: e.message };
  }
});

// ============================================================================
// IPC: Auth (Google Login)
// ============================================================================
ipcMain.on('auth:start-google-login', () => {
  if (authWindow) {
    authWindow.focus();
    return;
  }

  authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: false,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const loginUrl = `${FLASK_URL}/auth/google`;
  authWindow.loadURL(loginUrl);

  authWindow.once('ready-to-show', () => authWindow.show());

  // 監聽轉址，攔截 /auth/success
  const handleAuthRedirect = (event, url) => {
    // [DEBUG] 印出目前視窗正在載入的網址
    console.log('Auth Window navigating to:', url);

    if (url.includes('/auth/success')) {
      console.log('✅ Detected success URL!'); // [DEBUG]
      try {
        const urlObj = new URL(url);
        const user = {
          id: urlObj.searchParams.get('uid'), // 確保這裡對應 main.py 的參數
          name: urlObj.searchParams.get('name'),
          avatar: urlObj.searchParams.get('avatar')
        };

        console.log('👤 User data extracted:', user); // [DEBUG]

        // 通知主視窗更新 UI
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('📡 Sending to mainWindow...'); // [DEBUG]
          mainWindow.webContents.send('auth:login-success', user);
        } else {
          console.error('❌ MainWindow is missing or destroyed!');
        }

        authWindow.destroy();
        authWindow = null;
      } catch (error) {
        console.error('Auth redirect error:', error);
      }
    }
  };

  authWindow.webContents.on('will-redirect', handleAuthRedirect);
  authWindow.webContents.on('did-navigate', handleAuthRedirect);

  authWindow.on('closed', () => {
    authWindow = null;
  });
});

// ============================================================================
// IPC: History Handlers
// ============================================================================

ipcMain.handle('history:get', async () => {
  try {
    const history = readDataFile('history.json');
    return { ok: true, data: history };
  } catch (error) {
    console.error('history:get error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('history:delete', async (event, url) => {
  try {
    const history = readDataFile('history.json');
    const updatedHistory = history.filter(item => item.url !== url);
    writeDataFile('history.json', updatedHistory);
    return { ok: true, data: updatedHistory };
  } catch (error) {
    console.error('history:delete error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('history:clear', async () => {
  try {
    writeDataFile('history.json', []);
    return { ok: true, data: [] };
  } catch (error) {
    console.error('history:clear error', error);
    return { ok: false, error: error.message };
  }
});

// ============================================================================
// IPC: Bookmarks Handlers
// ============================================================================

ipcMain.handle('bookmarks:add', async (event, bookmarkData) => {
  try {
    if (!bookmarkData || !bookmarkData.url) {
      return { ok: false, error: 'URL is required' };
    }

    const bookmarks = readDataFile('bookmarks.json');

    // Check if bookmark already exists
    const exists = bookmarks.some(item => item.url === bookmarkData.url);
    if (exists) {
      return { ok: false, error: 'Bookmark already exists' };
    }

    const newBookmark = {
      title: bookmarkData.title || 'Untitled',
      url: bookmarkData.url,
      addedAt: new Date().toISOString()
    };

    const updatedBookmarks = [newBookmark, ...bookmarks];
    writeDataFile('bookmarks.json', updatedBookmarks);

    return { ok: true, data: updatedBookmarks };
  } catch (error) {
    console.error('bookmarks:add error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('bookmarks:remove', async (event, url) => {
  try {
    if (!url) {
      return { ok: false, error: 'URL is required' };
    }

    const bookmarks = readDataFile('bookmarks.json');
    const updatedBookmarks = bookmarks.filter(item => item.url !== url);

    writeDataFile('bookmarks.json', updatedBookmarks);

    return { ok: true, data: updatedBookmarks };
  } catch (error) {
    console.error('bookmarks:remove error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('bookmarks:get', async () => {
  try {
    const bookmarks = readDataFile('bookmarks.json');
    return { ok: true, data: bookmarks };
  } catch (error) {
    console.error('bookmarks:get error', error);
    return { ok: false, error: error.message };
  }
});

// ============================================================================
// Capture navigation events from all webviews (tabs)
// ============================================================================
app.on('web-contents-created', (event, contents) => {
  // Only listen to webviews (tabs), not the main window itself
  if (contents.getType() === 'webview') {
    // Capture when a user navigates to a new URL
    contents.on('did-navigate', (event, url) => {
      addToHistory(contents.getTitle(), url);
    });

    // Update history again when title is finalized (for better UX)
    contents.on('page-title-updated', (event, title) => {
      addToHistory(title, contents.getURL());
    });
  }
});

// Electron 準備好時建立視窗
app.whenReady().then(() => {
  // Start Flask server automatically (Removed)
  // startFlaskServer();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  initLocalAI(); // 啟動時載入模型

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle('ai:chat', async (event, prompt) => {
  // 檢查 aiSession 是否已經成功建立
  if (!aiSession) {
    return "系統提示：AI 模型正在載入中或發生錯誤，請稍後再試。";
  }
  
  try {
    // 傳送提示詞給本地模型並等待回應
    const response = await aiSession.prompt(prompt);
    return response;
  } catch (error) {
    return "AI 生成時發生錯誤：" + error.message;
  }
});

// 所有視窗關閉時退出應用程式（macOS 除外）
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Ensure Flask child is killed when app is quitting (Removed)
/*
app.on('before-quit', () => {
  if (flaskProcess) {
    try {
      // attempt graceful kill
      flaskProcess.kill();
    } catch (e) {
      console.error('Error killing Flask process:', e);
    }
    flaskProcess = null;
  }
});
*/

/**
 * Start Flask server as a child process (only once).
 * (Removed)
 */
function startFlaskServer() {
  console.log('Flask server capability removed.');
}



// ============================================================================
// IPC: Smart Notes Handlers
// ============================================================================

ipcMain.handle('notes:get', async () => {
  try {
    const notes = readDataFile('notes.json');
    return { ok: true, data: notes };
  } catch (error) {
    console.error('notes:get error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:add', async (event, noteData) => {
  try {
    if (!noteData || !noteData.content) {
      return { ok: false, error: 'Content is required' };
    }

    const notes = readDataFile('notes.json');

    // DUPLICATE CHECK: Ignore if identical to the latest note
    if (notes.length > 0) {
      const latest = notes[0];
      if (latest.content === noteData.content && latest.sourceUrl === noteData.sourceUrl) {
        return { ok: true, data: notes, added: false };
      }
    }

    // Create new note
    const newNote = {
      id: Date.now().toString(),
      content: noteData.content,
      sourceUrl: noteData.sourceUrl || '',
      timestamp: new Date().toISOString()
    };

    // Add to top
    const updatedNotes = [newNote, ...notes];
    writeDataFile('notes.json', updatedNotes);

    return { ok: true, data: updatedNotes, added: true };
  } catch (error) {
    console.error('notes:add error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:delete', async (event, noteId) => {
  try {
    if (!noteId) {
      return { ok: false, error: 'Note ID is required' };
    }

    const notes = readDataFile('notes.json');
    const updatedNotes = notes.filter(n => n.id !== noteId);

    writeDataFile('notes.json', updatedNotes);

    return { ok: true, data: updatedNotes };
  } catch (error) {
    console.error('notes:delete error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:clear', async () => {
  try {
    writeDataFile('notes.json', []);
    return { ok: true, data: [] };
  } catch (error) {
    console.error('notes:clear error', error);
    return { ok: false, error: error.message };
  }
});


// 將變數初始化為 null，防止 Cannot access before initialization 錯誤
let llama = null;
let aiModel = null;
let aiContext = null;
let aiSession = null;

// 初始化本地 AI 的函數
async function initLocalAI() {
  try {
    // 【關鍵修改】：使用動態 import() 載入套件
    const { getLlama, LlamaChatSession } = await import("node-llama-cpp");

    llama = await getLlama();
    aiModel = await llama.loadModel({
      // 請確認 models 資料夾內有這個檔案，且檔名正確
      modelPath: path.join(__dirname, "models", "Meta-Llama-3.1-8B-Instruct-Q8_0.gguf") 
    });
    aiContext = await aiModel.createContext();
    aiSession = new LlamaChatSession({
      contextSequence: aiContext.getSequence()
    });
    console.log("✅ 本地 AI 模型載入完成！");
  } catch (error) {
    console.error("❌ 載入本地 AI 模型失敗:", error);
  }
}