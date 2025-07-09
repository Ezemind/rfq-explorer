const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
  query: (query, params) => ipcRenderer.invoke('db-query', query, params), // Alias for compatibility
  dbTest: () => ipcRenderer.invoke('db-test'),
  
  // Authentication
  authLogin: (credentials) => ipcRenderer.invoke('auth-login', credentials),
  hashPassword: (password) => ipcRenderer.invoke('hash-password', password),
  
  // User management
  resetUserPassword: (data) => ipcRenderer.invoke('reset-user-password', data),
  
  // WhatsApp operations
  whatsappSendMessage: (data) => ipcRenderer.invoke('whatsapp-send-message', data),
  sendMessage: (data) => ipcRenderer.invoke('whatsapp-send-message', data), // Alias for compatibility
  
  // Notifications
  showNotification: (data) => ipcRenderer.invoke('show-notification', data),
  
  // Media operations
  getMediaUrl: (path, phone) => ipcRenderer.invoke('get-media-url', path, phone),
  fetchAudioBlob: (url) => ipcRenderer.invoke('fetch-audio-blob', url),
  backupMediaToDrive: (data) => ipcRenderer.invoke('backup-media-to-drive', data),
  
  // File operations
  uploadFile: (data) => ipcRenderer.invoke('upload-file', data),
  
  // Email operations
  emailTestConnection: (config) => ipcRenderer.invoke('email-test-connection', config),
  emailSend: (data) => ipcRenderer.invoke('email-send', data),
  emailScheduleFollowup: (data) => ipcRenderer.invoke('email-schedule-followup', data),
  emailProcessScheduled: () => ipcRenderer.invoke('email-process-scheduled'),
  emailAutoScheduleRfqFollowups: (data) => ipcRenderer.invoke('email-auto-schedule-rfq-followups', data),
  
  // AI Control operations
  aiGetStatus: (phoneNumber) => ipcRenderer.invoke('ai-get-status', phoneNumber),
  getAIStatus: (phoneNumber) => ipcRenderer.invoke('ai-get-status', phoneNumber), // Alias for compatibility
  aiToggleStatus: (phoneNumber, enabled) => ipcRenderer.invoke('ai-toggle-status', phoneNumber, enabled),
  toggleAIStatus: (phoneNumber, enabled) => ipcRenderer.invoke('ai-toggle-status', phoneNumber, enabled), // Alias for compatibility
  aiDisableForHumanTakeover: (phoneNumber) => ipcRenderer.invoke('ai-disable-for-human-takeover', phoneNumber),
  disableAIForHumanTakeover: (phoneNumber) => ipcRenderer.invoke('ai-disable-for-human-takeover', phoneNumber), // Alias for compatibility
  aiCanRespond: (phoneNumber) => ipcRenderer.invoke('ai-can-respond', phoneNumber),
  canAIRespond: (phoneNumber) => ipcRenderer.invoke('ai-can-respond', phoneNumber), // Alias for compatibility
  aiReenableAfterTimeout: () => ipcRenderer.invoke('ai-reenable-after-timeout'),
  
  // Generic invoke function for any IPC calls
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // External operations
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Auto-updater operations
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Test IPC communication
  testIPC: () => ipcRenderer.invoke('test-ipc'),
  
  // Auto-updater events
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', callback);
    return () => ipcRenderer.removeListener('download-progress', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', callback);
    return () => ipcRenderer.removeListener('update-not-available', callback);
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', callback);
    return () => ipcRenderer.removeListener('update-error', callback);
  },
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', callback);
    return () => ipcRenderer.removeListener('update-status', callback);
  }
});
