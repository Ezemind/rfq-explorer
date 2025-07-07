const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
  
  // Authentication
  authLogin: (credentials) => ipcRenderer.invoke('auth-login', credentials),
  
  // WhatsApp operations
  whatsappSendMessage: (data) => ipcRenderer.invoke('whatsapp-send-message', data),
  
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
  
  // External operations
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Auto-updater operations
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
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
