const { app, BrowserWindow, ipcMain, globalShortcut, Menu, clipboard, shell, session } = require('electron');
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
let authWindow = null; // [新增]
let currentUser = 'guest'; // [新增] 追蹤當前使用者，預設為訪客
let isMuteModeActive = false;// 追蹤是否在靜音模式
let isDownloadListenerRegistered = false;

// [新增] 接收前端傳來的使用者名稱，切換資料夾身分
ipcMain.handle('auth:set-user', (event, username) => {
  let safeUser = 'guest';
  if (username && typeof username === 'string') {
    safeUser = username.replace(/[^A-Za-z0-9._-]/g, '').replace(/\.\.+/g, '');
    if (!safeUser) safeUser = 'guest';
  }
  currentUser = safeUser;
  console.log(`👤 Current user set to: ${currentUser}`);
  return { ok: true, user: currentUser };
});

ipcMain.handle('sidebar:set-width', async (event, width) => {
  const parsedWidth = Number(width);
  return {
    ok: Number.isFinite(parsedWidth),
    width: Number.isFinite(parsedWidth) ? parsedWidth : null
  };
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

function deriveNoteTitle(body, sourceUrl) {
  if (sourceUrl) {
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch (error) {
      // Fall back to the note body when the URL is not parseable.
    }
  }

  if (typeof body === 'string') {
    const firstLine = body
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean);

    if (firstLine) {
      return firstLine.slice(0, 60);
    }
  }

  return 'New Note';
}

function normalizeStoredNote(note) {
  const body = typeof note?.body === 'string'
    ? note.body
    : typeof note?.content === 'string'
      ? note.content
      : '';
  const sourceUrl = typeof note?.sourceUrl === 'string' ? note.sourceUrl : '';
  const updated = typeof note?.updated === 'string'
    ? note.updated
    : typeof note?.timestamp === 'string'
      ? note.timestamp
      : new Date().toISOString();
  const id = note?.id != null ? String(note.id) : Date.now().toString();
  const title = typeof note?.title === 'string' && note.title.trim()
    ? note.title.trim()
    : deriveNoteTitle(body, sourceUrl);

  return {
    id,
    title,
    body,
    sourceUrl,
    updated
  };
}

function readNotes() {
  const notes = readDataFile('notes.json');
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes
    .map(normalizeStoredNote)
    .sort((left, right) => new Date(right.updated) - new Date(left.updated));
}

function writeNotes(notes) {
  return writeDataFile('notes.json', notes.map(normalizeStoredNote));
}

function normalizeDownloadEntry(entry = {}) {
  const validStatus = new Set(['downloading', 'completed', 'cancelled', 'interrupted']);
  const startedAt = typeof entry.startedAt === 'string' ? entry.startedAt : new Date().toISOString();
  const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : startedAt;
  const id = entry?.id ? String(entry.id) : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const status = validStatus.has(entry.status) ? entry.status : 'completed';

  return {
    id,
    fileName: typeof entry.fileName === 'string' ? entry.fileName : 'download',
    url: typeof entry.url === 'string' ? entry.url : '',
    path: typeof entry.path === 'string' ? entry.path : '',
    sourceTitle: typeof entry.sourceTitle === 'string' ? entry.sourceTitle : '',
    totalBytes: Number.isFinite(Number(entry.totalBytes)) ? Number(entry.totalBytes) : 0,
    receivedBytes: Number.isFinite(Number(entry.receivedBytes)) ? Number(entry.receivedBytes) : 0,
    status,
    startedAt,
    updatedAt
  };
}

function readDownloads() {
  const downloads = readDataFile('downloads.json');
  if (!Array.isArray(downloads)) {
    return [];
  }

  return downloads
    .map(normalizeDownloadEntry)
    .sort((left, right) => new Date(right.startedAt) - new Date(left.startedAt));
}

function writeDownloads(downloads) {
  const normalized = Array.isArray(downloads) ? downloads.map(normalizeDownloadEntry) : [];
  return writeDataFile('downloads.json', normalized);
}

function pushDownloadUpdateToRenderer(download) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('downloads:updated', normalizeDownloadEntry(download));
  }
}

function upsertDownload(entry) {
  const normalizedEntry = normalizeDownloadEntry(entry);
  const downloads = readDownloads();
  const existingIndex = downloads.findIndex(item => item.id === normalizedEntry.id);
  const timestamp = new Date().toISOString();
  let finalEntry = normalizedEntry;

  if (existingIndex >= 0) {
    finalEntry = normalizeDownloadEntry({
      ...downloads[existingIndex],
      ...normalizedEntry,
      startedAt: downloads[existingIndex].startedAt || normalizedEntry.startedAt,
      updatedAt: timestamp
    });
    downloads.splice(existingIndex, 1);
  } else {
    finalEntry = normalizeDownloadEntry({
      ...normalizedEntry,
      updatedAt: timestamp
    });
  }

  downloads.unshift(finalEntry);
  writeDownloads(downloads);
  pushDownloadUpdateToRenderer(finalEntry);
  return finalEntry;
}

function removeDownloadById(downloadId) {
  const id = String(downloadId || '');
  if (!id) return readDownloads();

  const downloads = readDownloads().filter(item => item.id !== id);
  writeDownloads(downloads);
  return downloads;
}

function getUniqueDownloadPath(fileName) {
  const downloadsDir = app.getPath('downloads');
  const baseName = path.basename(fileName || 'download');
  const ext = path.extname(baseName);
  const stem = ext ? baseName.slice(0, -ext.length) : baseName;

  let candidatePath = path.join(downloadsDir, baseName);
  let counter = 1;

  while (fs.existsSync(candidatePath)) {
    candidatePath = path.join(downloadsDir, `${stem} (${counter})${ext}`);
    counter += 1;
  }

  return candidatePath;
}

function setupDownloadCapture() {
  if (isDownloadListenerRegistered) {
    return;
  }

  const electronSession = session.defaultSession;
  if (!electronSession) {
    return;
  }

  isDownloadListenerRegistered = true;

  electronSession.on('will-download', (event, item, webContents) => {
    const downloadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const fileName = item.getFilename() || 'download';
    const savePath = getUniqueDownloadPath(fileName);
    const totalBytes = item.getTotalBytes() || 0;

    item.setSavePath(savePath);

    let latestEntry = upsertDownload({
      id: downloadId,
      fileName,
      url: item.getURL(),
      path: savePath,
      sourceTitle: webContents?.getTitle?.() || '',
      totalBytes,
      receivedBytes: 0,
      status: 'downloading',
      startedAt: new Date().toISOString()
    });

    item.on('updated', (updateEvent, state) => {
      const status = state === 'interrupted' ? 'interrupted' : 'downloading';
      latestEntry = upsertDownload({
        ...latestEntry,
        status,
        totalBytes: item.getTotalBytes() || latestEntry.totalBytes || 0,
        receivedBytes: item.getReceivedBytes() || 0
      });
    });

    item.once('done', (doneEvent, state) => {
      const statusMap = {
        completed: 'completed',
        cancelled: 'cancelled',
        interrupted: 'interrupted'
      };
      const status = statusMap[state] || 'cancelled';
      const resolvedTotalBytes = item.getTotalBytes() || latestEntry.totalBytes || 0;
      const resolvedReceivedBytes = status === 'completed'
        ? (resolvedTotalBytes || item.getReceivedBytes() || latestEntry.receivedBytes || 0)
        : (item.getReceivedBytes() || latestEntry.receivedBytes || 0);

      upsertDownload({
        ...latestEntry,
        status,
        totalBytes: resolvedTotalBytes,
        receivedBytes: resolvedReceivedBytes
      });
    });
  });
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
  const preloadPath = path.join(__dirname, '..', 'preload', 'preload.js');
  const iconPath = path.join(__dirname, '..', 'renderer', 'assets', 'icon.png');

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
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'features', 'browser', 'browser.html'));

  // 開發模式下開啟 DevTools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // 1. 攔截 Alt + F4 或點擊關閉
  mainWindow.on('close', (event) => {
    if (isMuteModeActive) {
      event.preventDefault();
      console.log('[Mute Mode] 已攔截關閉視窗');
    }
  });

  // 2. 攔截 Win + D 導致的最小化
  mainWindow.on('minimize', (event) => {
    if (isMuteModeActive) {
      event.preventDefault(); // 嘗試阻止最小化
      if (mainWindow) {
        mainWindow.restore(); // 如果還是被最小化了，強制恢復
        mainWindow.focus();   // 強制獲取焦點
      }
      console.log('[Mute Mode] 已攔截最小化 (Win + D)');
    }
  });

  // 3. 失去焦點時強制拉回 (防禦 Alt+Tab 或點擊其他副螢幕)
  mainWindow.on('blur', () => {
    if (isMuteModeActive && mainWindow) {
      mainWindow.focus();
    }
  });

  mainWindow.on('hide', (event) => {
    if (isMuteModeActive && mainWindow) {
      event.preventDefault();
      mainWindow.show();
      mainWindow.focus();
    }
  });

}

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
// IPC: Downloads Handlers
// ============================================================================

ipcMain.handle('downloads:get', async () => {
  try {
    return { ok: true, data: readDownloads() };
  } catch (error) {
    console.error('downloads:get error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('downloads:open', async (event, downloadId) => {
  try {
    const target = readDownloads().find(item => item.id === String(downloadId || ''));
    if (!target) {
      return { ok: false, error: 'Download not found' };
    }
    if (!target.path || !fs.existsSync(target.path)) {
      return { ok: false, error: 'Downloaded file is missing' };
    }

    const openError = await shell.openPath(target.path);
    if (openError) {
      return { ok: false, error: openError };
    }

    return { ok: true };
  } catch (error) {
    console.error('downloads:open error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('downloads:show-in-folder', async (event, downloadId) => {
  try {
    const target = readDownloads().find(item => item.id === String(downloadId || ''));
    if (!target) {
      return { ok: false, error: 'Download not found' };
    }
    if (!target.path || !fs.existsSync(target.path)) {
      return { ok: false, error: 'Downloaded file is missing' };
    }

    shell.showItemInFolder(target.path);
    return { ok: true };
  } catch (error) {
    console.error('downloads:show-in-folder error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('downloads:remove', async (event, downloadId) => {
  try {
    if (!downloadId) {
      return { ok: false, error: 'Download ID is required' };
    }

    const updated = removeDownloadById(downloadId);
    return { ok: true, data: updated };
  } catch (error) {
    console.error('downloads:remove error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('downloads:clear', async () => {
  try {
    writeDownloads([]);
    return { ok: true, data: [] };
  } catch (error) {
    console.error('downloads:clear error', error);
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

    contents.on('context-menu', (menuEvent, params) => {
      const menuItems = [];

      if (params.selectionText && params.selectionText.trim()) {
        menuItems.push({
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: () => {
            contents.copy();
          }
        });
      }

      if (params.mediaType === 'image' && params.srcURL) {
        menuItems.push({
          label: 'Copy image link',
          click: () => {
            clipboard.writeText(params.srcURL);
          }
        });
      }

      if (params.isEditable) {
        menuItems.push({
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => {
            contents.cut();
          }
        });
        menuItems.push({
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            contents.paste();
          }
        });
      }

      if (menuItems.length === 0) {
        menuItems.push({
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          enabled: contents.canGoBack(),
          click: () => {
            contents.goBack();
          }
        });
        menuItems.push({
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          enabled: contents.canGoForward(),
          click: () => {
            contents.goForward();
          }
        });
        menuItems.push({
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            contents.reload();
          }
        });
      }

      Menu.buildFromTemplate(menuItems).popup();
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
  setupDownloadCapture();

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
// IPC: 靜音模式 (Mute / Kiosk Mode)
// ============================================================================
ipcMain.handle('system:enter-mute', () => {
  if (mainWindow) {
    isMuteModeActive = true;
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');

    // 新增：隱藏工作列圖示，減少被干擾的機會
    mainWindow.setSkipTaskbar(true);

    // 將 Super+D (Win+D) 和 Super+Tab (Win+Tab) 加入攔截名單
    const blockKeys = [
      'CommandOrControl+Q',
      'CommandOrControl+W',
      'Alt+F4',
      'Alt+Tab',
      'Escape',
      'Super+D',   // 攔截 Win + D (顯示桌面)
      'Super+Tab'  // 攔截 Win + Tab (工作檢視)
    ];

    blockKeys.forEach(key => {
      globalShortcut.register(key, () => {
        console.log(`[Mute Mode] 已攔截快速鍵: ${key}`);
      });
    });
    return { ok: true };
  }
  return { ok: false };
});

ipcMain.handle('system:exit-mute', () => {
  if (mainWindow) {
    isMuteModeActive = false;
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);

    // 恢復顯示工作列圖示
    mainWindow.setSkipTaskbar(false);

    globalShortcut.unregisterAll();
    return { ok: true };
  }
  return { ok: false };
});


// ============================================================================
// IPC: Smart Notes Handlers
// ============================================================================

ipcMain.handle('notes:get', async () => {
  try {
    const notes = readNotes();
    return { ok: true, data: notes };
  } catch (error) {
    console.error('notes:get error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:add', async (event, noteData) => {
  try {
    const content = typeof noteData?.content === 'string' ? noteData.content.trim() : '';
    const sourceUrl = typeof noteData?.sourceUrl === 'string' ? noteData.sourceUrl : '';

    if (!content) {
      return { ok: false, error: 'Content is required' };
    }

    const notes = readNotes();

    // DUPLICATE CHECK: Ignore if identical to the latest note
    if (notes.length > 0) {
      const latest = notes[0];
      if (latest.body === content && latest.sourceUrl === sourceUrl) {
        return { ok: true, data: notes, added: false };
      }
    }

    // Create new note
    const newNote = normalizeStoredNote({
      id: Date.now().toString(),
      title: deriveNoteTitle(content, sourceUrl),
      body: content,
      sourceUrl,
      updated: new Date().toISOString()
    });

    // Add to top
    const updatedNotes = [newNote, ...notes];
    writeNotes(updatedNotes);

    return { ok: true, data: updatedNotes, added: true };
  } catch (error) {
    console.error('notes:add error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:save', async (event, noteData) => {
  try {
    if (!noteData || typeof noteData !== 'object') {
      return { ok: false, error: 'Note data is required' };
    }

    const body = typeof noteData.body === 'string' ? noteData.body.trimEnd() : '';
    const sourceUrl = typeof noteData.sourceUrl === 'string' ? noteData.sourceUrl : '';

    if (!body && !sourceUrl) {
      return { ok: false, error: 'Note body is required' };
    }

    const notes = readNotes();
    const updated = new Date().toISOString();
    const title = typeof noteData.title === 'string' && noteData.title.trim()
      ? noteData.title.trim()
      : deriveNoteTitle(body, sourceUrl);
    const noteId = noteData.id != null ? String(noteData.id) : null;
    const existingIndex = noteId ? notes.findIndex(note => note.id === noteId) : -1;

    let savedNote;

    if (existingIndex >= 0) {
      savedNote = normalizeStoredNote({
        ...notes[existingIndex],
        id: notes[existingIndex].id,
        title,
        body,
        sourceUrl,
        updated
      });
      notes.splice(existingIndex, 1);
      notes.unshift(savedNote);
    } else {
      savedNote = normalizeStoredNote({
        id: Date.now().toString(),
        title,
        body,
        sourceUrl,
        updated
      });
      notes.unshift(savedNote);
    }

    writeNotes(notes);

    return { ok: true, data: savedNote, notes };
  } catch (error) {
    console.error('notes:save error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:delete', async (event, noteId) => {
  try {
    if (!noteId) {
      return { ok: false, error: 'Note ID is required' };
    }

    const notes = readNotes();
    const updatedNotes = notes.filter(n => n.id !== noteId);

    writeNotes(updatedNotes);

    return { ok: true, data: updatedNotes };
  } catch (error) {
    console.error('notes:delete error', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('notes:clear', async () => {
  try {
    writeNotes([]);
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

ipcMain.handle('ai:get-local-models', () => {
  const modelsDir = path.join(__dirname, '..', '..', 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    return [];
  }

  // 只讀取 .gguf 結尾的檔案
  const files = fs.readdirSync(modelsDir);
  return files.filter(file => file.endsWith('.gguf'));
});

ipcMain.handle('ai:load-model', async (event, filename) => {
  if (!filename || typeof filename !== 'string') {
    return { ok: false, error: 'Invalid filename' };
  }
  if (filename !== path.basename(filename) || !filename.endsWith('.gguf')) {
    return { ok: false, error: 'Invalid model filename' };
  }
  
  const modelsDir = path.resolve(__dirname, '..', '..', 'models');
  const resolvedPath = path.resolve(modelsDir, filename);
  const relPath = path.relative(modelsDir, resolvedPath);
  
  if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
    return { ok: false, error: 'Path traversal detected' };
  }
  
  return await initLocalAI(filename);
});

// 初始化本地 AI 的函數
async function initLocalAI(modelFilename = "Meta-Llama-3.1-8B-Instruct-Q8_0.gguf") {
  try {
    const { getLlama, LlamaChatSession } = await import("node-llama-cpp");

    // Llama 實例只需初始化一次
    if (!llama) {
      llama = await getLlama();
    }

    const modelPath = path.join(__dirname, '..', '..', 'models', modelFilename);
    
    if (!fs.existsSync(modelPath)) {
      throw new Error(`找不到模型檔案：${modelFilename}`);
    }

    console.log(`⏳ 正在載入本地 AI 模型: ${modelFilename}...`);
    
    // 載入新模型並建立 Session
    aiModel = await llama.loadModel({ modelPath: modelPath });
    aiContext = await aiModel.createContext();
    aiSession = new LlamaChatSession({
      contextSequence: aiContext.getSequence()
    });
    
    console.log(`✅ 本地 AI 模型 (${modelFilename}) 載入完成！`);
    return { ok: true };
  } catch (error) {
    console.error("❌ 載入本地 AI 模型失敗:", error);
    return { ok: false, error: error.message };
  }
}
