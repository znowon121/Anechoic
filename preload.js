const { contextBridge, ipcRenderer } = require('electron');

// 將安全嘅 API 暴露俾 renderer process
// 注意：所有 IPC 都應該經由 preload.js 暴露，避免 renderer 直接存取 node/electron
contextBridge.exposeInMainWorld('electronAPI', {
  // 打開 Chatroom 視窗（主進程會啟動或聚焦該視窗）
  openChatroom: async () => ipcRenderer.invoke('chatroom:open-window'),

  // 接收來自 main process 嘅事件（例如 URL 更新）
  on: (channel, callback) => {
    const validChannels = ['chatroom:message-received'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // 移除監聽器
  removeListener: (channel, callback) => {
    const validChannels = ['chatroom:message-received'];
  }
});

// ============================================================================
// Expose History & Bookmarks API securely via contextBridge
// ============================================================================

contextBridge.exposeInMainWorld('anechoicAPI', {
  // History API
  getHistory: async () => {
    try {
      return await ipcRenderer.invoke('history:get');
    } catch (error) {
      console.error('getHistory error:', error);
      return { ok: false, error: error.message };
    }
  },

  // Bookmarks API
  getBookmarks: async () => {
    try {
      return await ipcRenderer.invoke('bookmarks:get');
    } catch (error) {
      console.error('getBookmarks error:', error);
      return { ok: false, error: error.message };
    }
  },

  addBookmark: async (data) => {
    try {
      if (!data || typeof data !== 'object') {
        return { ok: false, error: 'Invalid bookmark data' };
      }
      return await ipcRenderer.invoke('bookmarks:add', data);
    } catch (error) {
      console.error('addBookmark error:', error);
      return { ok: false, error: error.message };
    }
  },

  removeBookmark: async (url) => {
    try {
      if (!url || typeof url !== 'string') {
        return { ok: false, error: 'Invalid URL' };
      }
      return await ipcRenderer.invoke('bookmarks:remove', url);
    } catch (error) {
      console.error('removeBookmark error:', error);
      return { ok: false, error: error.message };
    }
  }
});
