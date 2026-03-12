const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  
  // 打開 Chatroom 視窗
  openChatroom: async () => ipcRenderer.invoke('chatroom:open-window'),

  // 設定 Sidebar 寬度
  setSidebarWidth: (width) => ipcRenderer.invoke('sidebar:set-width', width),

  // 接收事件
  on: (channel, callback) => {
    const validChannels = ['chatroom:message-received', 'auth:login-success'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // 獲取本地模型列表
  getLocalModels: () => ipcRenderer.invoke('ai:get-local-models'),

  // 請求載入特定的本地模型
  loadLocalModel: (filename) => ipcRenderer.invoke('ai:load-model', filename),
  
  // [新增] 本地 AI 呼叫介面
  chatWithLocalAI: (prompt) => ipcRenderer.invoke('ai:chat', prompt),

  // Generic Invoke for dynamic features
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // === [新增] Google Login ===
  startGoogleLogin: () => ipcRenderer.send('auth:start-google-login'),

  onLoginSuccess: (callback) => ipcRenderer.on('auth:login-success', (event, user) => callback(user)),

  setCurrentUser: (username) => ipcRenderer.invoke('auth:set-user', username),
  // Generic Invoke for dynamic features
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // 靜音模式 (鎖定電腦)
  enterMuteMode: () => ipcRenderer.invoke('system:enter-mute'),
  exitMuteMode: () => ipcRenderer.invoke('system:exit-mute'),
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
