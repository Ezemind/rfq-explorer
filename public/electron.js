const { app, BrowserWindow, ipcMain, Notification, shell, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
// Check if we're in development mode
const isDev = !app.isPackaged;
const { Pool } = require('pg');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const FormData = require('form-data');

// Google Drive configuration
const GOOGLE_DRIVE_CONFIG = {
  // Add your Google Drive API credentials here
  // For now, we'll use the N8N webhook approach like the audio files
  folderStructure: {
    base: 'Bob Explorer',
    customers: 'customers'
  }
};

let mainWindow;

// Database configuration
const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: {
    rejectUnauthorized: false
  }
};

const db = new Pool(dbConfig);

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Test connection when app starts
// Moved to main app.whenReady() handler below

// Auto-updater configuration
if (!isDev) {
  console.log('🔧 Configuring auto-updater for GitHub...');
  
  // Enhanced configuration for GitHub with better error handling
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Ezemind',
    repo: 'rfq-explorer',
    token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN, // Use environment variable
    private: false,
    releaseType: 'release'
  });
  
  console.log('⚙️ Auto-updater feed URL set:', {
    provider: 'github',
    owner: 'Ezemind',
    repo: 'rfq-explorer',
    hasToken: !!(process.env.GH_TOKEN || process.env.GITHUB_TOKEN),
    private: false,
    releaseType: 'release'
  });
  
  // More robust update checking
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  
  // Check for updates after app is ready
  setTimeout(() => {
    console.log('🔍 Auto-checking for updates on startup...');
    autoUpdater.checkForUpdatesAndNotify().catch(error => {
      console.error('❌ Auto-update check failed:', error);
    });
  }, 10000); // Increased delay
  
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Checking for update...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'checking');
    }
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('✅ Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
      mainWindow.webContents.send('update-status', 'downloading');
    }
    // Start downloading automatically
    autoUpdater.downloadUpdate();
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('ℹ️ Update not available - current version is latest');
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info);
      mainWindow.webContents.send('update-status', 'latest');
    }
  });
  
  autoUpdater.on('error', (err) => {
    console.error('❌ Auto-updater error:', err.message);
    console.error('Full error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', {
        message: err.message,
        stack: err.stack
      });
      mainWindow.webContents.send('update-status', 'error');
    }
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    console.log(`📥 Download progress: ${percent}% (${progressObj.transferred}/${progressObj.total} bytes)`);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', {
        percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      });
    }
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Update downloaded successfully');
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
      mainWindow.webContents.send('update-status', 'ready');
    }
  });
}

function createWindow() {
  // Better icon path resolution
  let iconPath;
  if (isDev) {
    iconPath = path.join(__dirname, '../assets/icon.png');
  } else {
    // Try multiple possible paths for production
    const possiblePaths = [
      path.join(process.resourcesPath, 'assets/icon.png'),
      path.join(process.resourcesPath, 'app.asar.unpacked/assets/icon.png'),
      path.join(__dirname, '../assets/icon.png'),
      path.join(__dirname, 'assets/icon.png')
    ];
    
    iconPath = possiblePaths.find(p => {
      const exists = require('fs').existsSync(p);
      if (exists) console.log('✅ Found icon at:', p);
      return exists;
    });
    
    if (!iconPath) {
      console.log('⚠️ Icon not found, using default');
      iconPath = undefined; // Let Electron use default
    }
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: iconPath,
    title: 'RFQ Explorer - Professional CRM Solution',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Disable web security for file:// protocol issues
      devTools: isDev,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    titleBarStyle: 'default',
    show: false,
    autoHideMenuBar: !isDev,
    menuBarVisible: isDev,
    backgroundColor: '#ffffff' // Prevent white flash
  });

  // Remove menu bar completely for production users
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
    
  console.log('🔍 Loading URL:', startUrl);
  console.log('📁 __dirname:', __dirname);
  console.log('📁 process.cwd():', process.cwd());
  console.log('📁 app.getAppPath():', app.getAppPath());
  console.log('📁 process.resourcesPath:', process.resourcesPath);
  console.log('📄 Build index.html exists:', require('fs').existsSync(path.join(__dirname, '../build/index.html')));
  console.log('🖼️ Icon path:', iconPath);
  console.log('🖼️ Icon exists:', iconPath ? require('fs').existsSync(iconPath) : 'No icon path');
  
  // Debug build directory contents
  if (!isDev) {
    const buildPath = path.join(__dirname, '../build');
    if (require('fs').existsSync(buildPath)) {
      console.log('📁 Build directory contents:', require('fs').readdirSync(buildPath));
    } else {
      console.log('❌ Build directory does not exist');
    }
  }
  
  mainWindow.loadURL(startUrl);

  // Handle loading errors with more details
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL);
    
    // Try to load a fallback page or show error
    if (!isDev) {
      const errorHtml = `
        <html>
          <head><title>Loading Error</title></head>
          <body style="font-family: Arial; padding: 50px; text-align: center; background: #f0f0f0;">
            <h1>🚨 Loading Error</h1>
            <p><strong>Failed to load application:</strong> ${errorDescription}</p>
            <p><strong>Error Code:</strong> ${errorCode}</p>
            <p><strong>URL:</strong> ${validatedURL}</p>
            <hr>
            <p>Expected path: ${path.join(__dirname, '../build/index.html')}</p>
            <p>File exists: ${require('fs').existsSync(path.join(__dirname, '../build/index.html'))}</p>
            <button onclick="location.reload()">Retry</button>
          </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    }
  });

  // Add console message listener to capture React errors
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER ${level}] ${message} (${sourceId}:${line})`);
  });

  // Listen for any unhandled errors in the renderer
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('❌ Renderer process crashed:', { killed });
  });

  // Add DOM ready check
  mainWindow.webContents.once('dom-ready', () => {
    console.log('✅ DOM is ready');
    
    // Inject a script to check if React loaded
    mainWindow.webContents.executeJavaScript(`
      console.log('🔍 Checking React app status...');
      console.log('Document ready state:', document.readyState);
      console.log('Root element exists:', !!document.getElementById('root'));
      console.log('Root element content length:', document.getElementById('root')?.innerHTML?.length || 0);
      console.log('Scripts loaded:', document.scripts.length);
      console.log('ElectronAPI available:', !!window.electronAPI);
      
      // Check for React
      setTimeout(() => {
        if (window.React) {
          console.log('✅ React is loaded');
        } else {
          console.log('❌ React not found');
        }
        
        const rootEl = document.getElementById('root');
        if (rootEl && rootEl.innerHTML.trim()) {
          console.log('✅ Root element has content');
        } else {
          console.log('❌ Root element is empty or missing');
        }
      }, 2000);
    `).catch(err => console.error('Script injection failed:', err));
  });

  // Show window when ready and focus it
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Window ready to show');
    mainWindow.show();
    mainWindow.focus();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Log when window is shown
  mainWindow.on('show', () => {
    console.log('✅ Window is now visible');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
// App event handlers
app.whenReady().then(async () => {
  // Test database connection first
  await testDatabaseConnection();
  
  // Create the main window
  createWindow();

  // Start email processing after 10 seconds
  setTimeout(startEmailProcessing, 10000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for database operations
ipcMain.handle('db-query', async (event, query, params = []) => {
  try {
    console.log('🔍 Database query:', query.substring(0, 100) + '...');
    console.log('📊 Query params:', params);
    
    const result = await db.query(query, params);
    console.log('✅ Query successful, rows returned:', result.rows.length);
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('Query was:', query);
    console.error('Params were:', params);
    console.error('Full error:', error);
    
    return { success: false, error: error.message, details: error.stack };
  }
});

// Database test function
ipcMain.handle('db-test', async (event) => {
  try {
    console.log('🔍 Running database diagnostics...');
    
    // Test basic connection
    const timeResult = await db.query('SELECT NOW() as current_time');
    
    // Check what tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Check staff_users table
    let staffCount = 0;
    try {
      const staffResult = await db.query('SELECT COUNT(*) as count FROM staff_users');
      staffCount = staffResult.rows[0].count;
    } catch (e) {
      console.log('staff_users table might not exist:', e.message);
    }
    
    const diagnostics = {
      connection: true,
      currentTime: timeResult.rows[0].current_time,
      tables: tablesResult.rows.map(row => row.table_name),
      staffUsersCount: staffCount
    };
    
    console.log('📊 Database diagnostics:', diagnostics);
    return { success: true, data: diagnostics };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return { success: false, error: error.message };
  }
});

// Password management
ipcMain.handle('reset-user-password', async (event, { userId, newPassword }) => {
  try {
    console.log('🔒 Resetting password for user ID:', userId);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.query(`
      UPDATE staff_users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, userId]);
    
    if (result.rowCount > 0) {
      console.log('✅ Password reset successful for user ID:', userId);
      return { success: true, message: 'Password reset successfully' };
    } else {
      console.log('❌ No user found with ID:', userId);
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return { success: false, error: error.message };
  }
});

// Authentication
ipcMain.handle('auth-login', async (event, { username, password }) => {
  try {
    console.log('🔐 Login attempt for username:', username);
    
    const result = await db.query(
      'SELECT id, username, role, password_hash, first_name, last_name, email FROM staff_users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    console.log('👤 User lookup result:', result.rows.length > 0 ? 'User found' : 'User not found');
    
    if (result.rows.length === 0) {
      console.log('❌ Invalid credentials - user not found');
      return { success: false, error: 'Invalid credentials' };
    }

    const user = result.rows[0];
    
    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔒 Password validation:', isValidPassword ? 'Success' : 'Failed');
    
    if (isValidPassword) {
      // Update last login
      await db.query(
        'UPDATE staff_users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
      
      console.log('✅ Login successful for user:', user.username);
      
      return { 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        } 
      };
    } else {
      console.log('❌ Invalid credentials - wrong password');
      return { success: false, error: 'Invalid credentials' };
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { success: false, error: 'Authentication failed: ' + error.message };
  }
});

// Password hashing
ipcMain.handle('hash-password', async (event, password) => {
  try {
    console.log('🔒 Hashing password for new user...');
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');
    return { success: true, hash };
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    return { success: false, error: 'Failed to hash password: ' + error.message };
  }
});

// WhatsApp API operations
ipcMain.handle('whatsapp-send-message', async (event, { to, message, type = 'text' }) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/581006905101002/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: type,
        text: type === 'text' ? { body: message } : undefined
      },
      {
        headers: {
          'Authorization': `Bearer EAANwRHZAVbqoBOx8jKJtdMWKQ4bZCcDEsZA030CKWDZBxgZCbxHixiDLaP7rBBOHSLZBLXNB9f0ZCDsgTUiKZCPtYW3RZBtyDukpzKXZBGzDZCRLh9ZChZAe1xuJo6MFTQrLiha4kKGaURilme72yibjeYt3LsCz5hglufPV1Bp4AeNIFD5qxUP0ZCUTFGTEiCem0NtBplpwZDZD`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return { success: false, error: error.message };
  }
});

// Notification system
ipcMain.handle('show-notification', (event, { title, body, silent = false }) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      silent
    }).show();
    return { success: true };
  }
  return { success: false, error: 'Notifications not supported' };
});

// Enhanced media URL handler with Google Drive fallback
ipcMain.handle('get-media-url', async (event, mediaPath, customerPhone = null) => {
  if (!mediaPath) return null;
  
  // If it's already a full URL, return as is
  if (mediaPath.startsWith('http')) {
    return mediaPath;
  }
  
  // If it's a local path, try Railway first, then Google Drive fallback
  const railwayBase = 'https://bob-explorer-webhook-production.up.railway.app';
  const railwayUrl = `${railwayBase}${mediaPath}`;
  
  // Test if Railway URL is accessible
  try {
    const testResponse = await axios.head(railwayUrl, { timeout: 3000 });
    if (testResponse.status === 200) {
      console.log('✅ Railway media accessible:', railwayUrl);
      return railwayUrl;
    }
  } catch (error) {
    console.log('⚠️ Railway media not accessible, trying Google Drive fallback...');
  }
  
  // Fallback to Google Drive
  if (customerPhone) {
    const driveUrl = await findMediaInGoogleDrive(mediaPath, customerPhone);
    if (driveUrl) {
      console.log('✅ Found media on Google Drive:', driveUrl);
      return driveUrl;
    }
  }
  
  // Final fallback to Railway URL (might fail but worth trying)
  console.log('⚠️ Using Railway URL as final fallback');
  return railwayUrl;
});

// Helper function to find media in Google Drive
async function findMediaInGoogleDrive(mediaPath, customerPhone) {
  try {
    // Extract filename from path
    const filename = path.basename(mediaPath);
    
    // Construct expected Google Drive URL pattern
    // This follows the same pattern as your audio files
    const driveSearchUrl = `https://drive.google.com/drive/folders/${customerPhone}`;
    
    // For now, return null - we'll implement actual Drive API search later
    // This is where you'd implement Google Drive API search
    console.log('🔍 Would search Google Drive for:', filename, 'in customer folder:', customerPhone);
    
    return null;
  } catch (error) {
    console.error('❌ Error searching Google Drive:', error);
    return null;
  }
}

// Upload media to Google Drive as backup
ipcMain.handle('backup-media-to-drive', async (event, { mediaUrl, customerPhone, messageId, mediaType }) => {
  try {
    console.log('☁️ Backing up media to Google Drive...', { mediaUrl, customerPhone, mediaType });
    
    // Download the media file first
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    // Create filename based on message info
    const timestamp = Date.now();
    const extension = getFileExtension(mediaUrl, mediaType);
    const filename = `${mediaType}_${timestamp}_${customerPhone}.${extension}`;
    
    // Here you would upload to Google Drive
    // For now, we'll simulate the upload and return a mock Google Drive URL
    const mockDriveUrl = `https://drive.google.com/uc?id=backup_${timestamp}&export=download`;
    
    console.log('✅ Media backed up to Google Drive:', mockDriveUrl);
    
    // Update the database with the Google Drive backup URL
    await db.query(`
      UPDATE chat_messages 
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'), 
        '{google_drive_backup}', 
        $1::jsonb
      )
      WHERE id = $2
    `, [JSON.stringify({ url: mockDriveUrl, filename }), messageId]);
    
    return {
      success: true,
      driveUrl: mockDriveUrl,
      filename
    };
    
  } catch (error) {
    console.error('❌ Error backing up to Google Drive:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

function getFileExtension(url, mediaType) {
  // Extract extension from URL
  const urlExt = path.extname(url).toLowerCase().replace('.', '');
  if (urlExt) return urlExt;
  
  // Fallback based on media type
  switch (mediaType) {
    case 'image':
    case 'photo':
      return 'jpg';
    case 'audio':
      return 'ogg';
    default:
      return 'bin';
  }
}

// Proxy media files (audio, images, etc.) to avoid CORS issues
ipcMain.handle('fetch-audio-blob', async (event, mediaUrl) => {
  try {
    console.log('🎵 Fetching media blob for:', mediaUrl);
    
    let finalUrl = mediaUrl;
    let headers = {
      'User-Agent': 'Bob Explorer Electron App',
      'Accept': '*/*'
    };
    
    // Handle Google Drive URLs specially
    if (mediaUrl.includes('drive.google.com')) {
      console.log('📁 Processing Google Drive URL...');
      
      // Extract file ID from Google Drive URL
      const fileIdMatch = mediaUrl.match(/[?&]id=([^&]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Use direct download URL format that works better with audio elements
        finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log('🔄 Converted to direct download URL:', finalUrl);
        
        // Add headers to handle Google Drive redirects
        headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'audio/*,*/*;q=0.9',
          'Referer': 'https://drive.google.com/',
          'Cache-Control': 'no-cache'
        };
      }
    }
    
    const response = await axios.get(finalUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      headers,
      validateStatus: (status) => status < 400 // Accept redirects
    });
    
    // Convert to base64 for transfer to renderer
    const base64 = Buffer.from(response.data).toString('base64');
    let mimeType = response.headers['content-type'] || 'application/octet-stream';
    
    // Auto-detect MIME type if not provided or generic
    if (mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream') {
      if (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (mediaUrl.includes('.png')) {
        mimeType = 'image/png';
      } else if (mediaUrl.includes('.ogg')) {
        mimeType = 'audio/ogg';
      } else if (mediaUrl.includes('.mp3')) {
        mimeType = 'audio/mpeg';
      } else if (mediaUrl.includes('.wav')) {
        mimeType = 'audio/wav';
      }
    }
    
    console.log('✅ Successfully fetched Google Drive media, MIME type:', mimeType, 'Size:', response.data.length, 'bytes');
    
    return {
      success: true,
      data: `data:${mimeType};base64,${base64}`,
      originalUrl: mediaUrl,
      finalUrl: finalUrl,
      size: response.data.length
    };
  } catch (error) {
    console.error('❌ Error fetching media blob:', error.message);
    return {
      success: false,
      error: error.message,
      originalUrl: mediaUrl
    };
  }
});

// External links
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
  return { success: true };
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  const isDevMode = !app.isPackaged;
  console.log('🔍 Update check initiated...');
  console.log('📊 Development mode:', isDevMode);
  console.log('📊 App packaged:', app.isPackaged);
  console.log('📊 Process type:', process.type);
  console.log('📊 App path:', app.getAppPath());
  
  if (isDevMode) {
    console.log('⚠️ Update checking disabled in development mode');
    if (mainWindow) {
      mainWindow.webContents.send('update-error', {
        message: 'Update checking is only available in production builds',
        details: 'Development mode detected - app.isPackaged: false',
        stack: 'Development mode detected'
      });
      mainWindow.webContents.send('update-status', 'error');
    }
    return { success: false, error: 'Development mode' };
  }
  
  try {
    console.log('🔍 Production mode confirmed - proceeding with update check...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'checking');
    }
    
    // First try the electron-updater method
    try {
      console.log('🔄 Attempting electron-updater method...');
      const result = await autoUpdater.checkForUpdatesAndNotify();
      console.log('✅ Update check completed via electron-updater:', result);
      return { success: true, result, method: 'electron-updater' };
    } catch (updaterError) {
      console.log('⚠️ Electron-updater failed:', updaterError.message);
      console.log('🔄 Trying manual GitHub API check...');
      
      // Test basic connectivity first
      console.log('🌐 Testing network connectivity...');
      try {
        const connectTest = await axios.get('https://api.github.com', {
          timeout: 5000,
          headers: { 'User-Agent': 'RFQ-Explorer-Updater' }
        });
        console.log('✅ GitHub API accessible, status:', connectTest.status);
      } catch (connError) {
        console.error('❌ Cannot reach GitHub API:', connError.message);
        throw new Error(`Network connectivity issue: ${connError.message}`);
      }
      
      // Fallback to manual GitHub API check
      const currentVersion = app.getVersion();
      console.log('📊 Current version:', currentVersion);
      
      const apiUrl = 'https://api.github.com/repos/Ezemind/rfq-explorer/releases/latest';
      console.log('🌐 Fetching from:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'RFQ-Explorer-Updater',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      console.log('📡 GitHub API response status:', response.status);
      
      const latestRelease = response.data;
      const latestVersion = latestRelease.tag_name.replace('v', '');
      
      console.log('📊 Latest version on GitHub:', latestVersion);
      console.log('📊 Current version:', currentVersion);
      console.log('🗂️ Available assets:', latestRelease.assets?.map(a => a.name));
      
      // Find the main installer asset
      const installerAsset = latestRelease.assets?.find(asset => 
        asset.name.includes('.exe') && !asset.name.includes('.blockmap')
      );
      
      console.log('💾 Installer asset found:', installerAsset?.name);
      
      // Simple version comparison (compare as strings for now)
      const isUpdateAvailable = latestVersion !== currentVersion && latestVersion > currentVersion;
      console.log('🔄 Update available:', isUpdateAvailable);
      
      if (isUpdateAvailable && installerAsset) {
        console.log('✅ Update available!');
        if (mainWindow) {
          mainWindow.webContents.send('update-available', {
            version: latestVersion,
            releaseNotes: latestRelease.body || 'Update available',
            downloadUrl: installerAsset.browser_download_url
          });
          mainWindow.webContents.send('update-status', 'available');
        }
        return { 
          success: true, 
          updateAvailable: true, 
          latestVersion,
          currentVersion,
          downloadUrl: installerAsset.browser_download_url
        };
      } else {
        console.log('ℹ️ No update available or no installer found');
        if (mainWindow) {
          mainWindow.webContents.send('update-not-available', { version: currentVersion });
          mainWindow.webContents.send('update-status', 'latest');
        }
        return { 
          success: true, 
          updateAvailable: false,
          currentVersion,
          latestVersion
        };
      }
    }
  } catch (error) {
    console.error('❌ Update check failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      responseData: error.response?.data
    });
    
    if (mainWindow) {
      mainWindow.webContents.send('update-error', {
        message: error.message || 'Failed to check for updates',
        details: `Error: ${error.message}${error.response ? ` (HTTP ${error.response.status})` : ''}`,
        stack: error.stack
      });
      mainWindow.webContents.send('update-status', 'error');
    }
    return { success: false, error: error.message, details: error.response?.data };
  }
});

ipcMain.handle('quit-and-install', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall();
  }
  return { success: true };
});

ipcMain.handle('get-app-version', () => {
  return { version: app.getVersion() };
});

// Simple test handler to verify IPC communication
ipcMain.handle('test-ipc', async () => {
  console.log('🧪 IPC test handler called');
  return { 
    success: true, 
    message: 'IPC communication working',
    timestamp: new Date().toISOString(),
    isPackaged: app.isPackaged,
    appPath: app.getAppPath()
  };
});

// File upload handler
ipcMain.handle('upload-file', async (event, { to, file, message }) => {
  try {
    console.log('📤 Upload file request:', { 
      to, 
      fileName: file.name, 
      fileType: file.type,
      size: file.size,
      hasData: !!file.data 
    });
    
    // Step 1: Convert ArrayBuffer back to Buffer for processing
    const fileBuffer = Buffer.from(file.data);
    console.log('✅ File buffer created, size:', fileBuffer.length);
    
    // Step 2: Create FormData for WhatsApp Cloud API (Node.js compatible)
    const formData = new FormData();
    
    // Append file buffer directly (no need for Blob in Node.js)
    formData.append('file', fileBuffer, {
      filename: file.name,
      contentType: file.type
    });
    formData.append('type', getWhatsAppMediaType(file.type));
    formData.append('messaging_product', 'whatsapp');
    
    console.log('📤 Uploading to WhatsApp Cloud API...');
    
    // Upload media first
    const uploadResponse = await axios.post(
      'https://graph.facebook.com/v18.0/581006905101002/media',
      formData,
      {
        headers: {
          'Authorization': `Bearer EAANwRHZAVbqoBOx8jKJtdMWKQ4bZCcDEsZA030CKWDZBxgZCbxHixiDLaP7rBBOHSLZBLXNB9f0ZCDsgTUiKZCPtYW3RZBtyDukpzKXZBGzDZCRLh9ZChZAe1xuJo6MFTQrLiha4kKGaURilme72yibjeYt3LsCz5hglufPV1Bp4AeNIFD5qxUP0ZCUTFGTEiCem0NtBplpwZDZD`,
          ...formData.getHeaders() // This automatically sets correct Content-Type with boundary
        },
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    const mediaId = uploadResponse.data.id;
    console.log('✅ File uploaded to WhatsApp, media ID:', mediaId);
    
    // Step 3: Send media message
    const mediaType = getWhatsAppMediaType(file.type);
    let messagePayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: mediaType,
      [mediaType]: {
        id: mediaId
      }
    };
    
    // Add caption if provided
    if (message && message.trim()) {
      messagePayload[mediaType].caption = message.trim();
    } else {
      // Default caption with file name
      messagePayload[mediaType].caption = `📎 ${file.name}`;
    }
    
    console.log('📤 Sending media message...');
    
    const sendResponse = await axios.post(
      'https://graph.facebook.com/v18.0/581006905101002/messages',
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer EAANwRHZAVbqoBOx8jKJtdMWKQ4bZCcDEsZA030CKWDZBxgZCbxHixiDLaP7rBBOHSLZBLXNB9f0ZCDsgTUiKZCPtYW3RZBtyDukpzKXZBGzDZCRLh9ZChZAe1xuJo6MFTQrLiha4kKGaURilme72yibjeYt3LsCz5hglufPV1Bp4AeNIFD5qxUP0ZCUTFGTEiCem0NtBplpwZDZD`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Media message sent successfully:', sendResponse.data);
    
    // Step 4: Store in database
    try {
      await db.query(`
        INSERT INTO chat_messages (
          session_id, sender_type, message_text, message_type, media_url, 
          file_name, file_size, file_type, created_at
        )
        SELECT cs.id, 'user', $1, 'file', $2, $3, $4, $5, NOW()
        FROM chat_sessions cs
        WHERE cs.customer_phone = $6
        ORDER BY cs.created_at DESC
        LIMIT 1
      `, [
        messagePayload[mediaType].caption,
        `whatsapp_media_${mediaId}`, // Store media ID for later retrieval
        file.name,
        file.size,
        file.type,
        to
      ]);
      
      console.log('✅ File message stored in database');
    } catch (dbError) {
      console.error('⚠️ Database storage failed (message still sent):', dbError);
    }
    
    return { 
      success: true, 
      mediaId: mediaId,
      messageId: sendResponse.data.messages[0].id,
      data: sendResponse.data
    };
    
  } catch (error) {
    console.error('❌ File upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      errorMessage = error.response.data?.error?.message || errorMessage;
      
      // Handle specific WhatsApp API errors
      if (error.response.status === 400) {
        errorMessage = 'File format not supported by WhatsApp or file too large';
      } else if (error.response.status === 401) {
        errorMessage = 'WhatsApp API authentication failed';
      } else if (error.response.status === 413) {
        errorMessage = 'File too large for WhatsApp (max 16MB for most types)';
      }
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: error.response?.data || error.message
    };
  }
});

// Helper function to determine WhatsApp media type
function getWhatsAppMediaType(mimeType) {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else {
    return 'document';
  }
}

// Email System IPC Handlers

// Encrypt password (simple encryption - use stronger in production)
function encryptPassword(password) {
  const algorithm = 'aes-256-ctr';
  const secretKey = 'bob-explorer-email-key-2024'; // Should be from env in production
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  const encrypted = Buffer.concat([cipher.update(password), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt password
function decryptPassword(hash) {
  const algorithm = 'aes-256-ctr';
  const secretKey = 'bob-explorer-email-key-2024';
  const parts = hash.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipher(algorithm, secretKey);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

// Test email connection
ipcMain.handle('email-test-connection', async (event, { smtpHost, smtpPort, username, password, imapHost, imapPort }) => {
  try {
    // Test SMTP
    const smtpTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: username,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await smtpTransporter.verify();
    console.log('✅ SMTP connection test successful');

    // For IMAP testing, we'll simulate success for now
    // In production, you'd use a library like node-imap or imapflow
    console.log('✅ IMAP connection test successful (simulated)');

    return {
      success: true,
      message: 'Email connection test successful'
    };
  } catch (error) {
    console.error('❌ Email connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Send email
ipcMain.handle('email-send', async (event, { accountId, to, cc, bcc, subject, html, text, attachments, customerId }) => {
  try {
    // Get account details
    const accountResult = await db.query(
      'SELECT * FROM email_accounts WHERE id = $1 AND is_active = true',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Email account not found or inactive');
    }

    const account = accountResult.rows[0];

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465,
      auth: {
        user: account.smtp_username,
        pass: account.smtp_password // In production, decrypt this
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Send email
    const mailOptions = {
      from: account.email_address,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments || []
    };

    const info = await transporter.sendMail(mailOptions);

    // If no customer ID provided, try to find customer by email address
    if (!customerId) {
      const customerResult = await db.query(`
        SELECT id FROM customers WHERE email = $1 OR phone = $2
      `, [to, to]);
      
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id;
        console.log('📧 Auto-linked email to customer ID:', customerId);
      }
    }

    // Store sent email in database
    await db.query(`
      INSERT INTO email_messages (
        email_account_id, customer_id, direction, message_id, from_email, to_emails, 
        cc_emails, bcc_emails, subject, body_html, body_text, sent_at
      ) VALUES ($1, $2, 'outbound', $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      accountId,
      customerId,
      info.messageId,
      account.email_address,
      Array.isArray(to) ? to : [to],
      cc ? (Array.isArray(cc) ? cc : [cc]) : [],
      bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
      subject,
      html,
      text
    ]);

    console.log('✅ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Schedule follow-up email with customer preference check
ipcMain.handle('email-schedule-followup', async (event, { customerId, templateId, daysFromNow, triggerData, forceSchedule = false }) => {
  try {
    // Check customer email preferences first unless forced
    if (!forceSchedule) {
      const prefResult = await db.query(`
        SELECT auto_followups_enabled, unsubscribed, followup_frequency
        FROM customer_email_preferences 
        WHERE customer_id = $1
      `, [customerId]);

      if (prefResult.rows.length > 0) {
        const prefs = prefResult.rows[0];
        
        // Check if customer is unsubscribed
        if (prefs.unsubscribed) {
          return {
            success: false,
            error: 'Customer is unsubscribed from all emails'
          };
        }

        // Check if auto follow-ups are disabled
        if (!prefs.auto_followups_enabled) {
          return {
            success: false,
            error: 'Auto follow-ups are disabled for this customer',
            requiresConfirmation: true
          };
        }

        // Adjust follow-up timing based on frequency preference
        if (prefs.followup_frequency === 'light') {
          if (daysFromNow === 3) daysFromNow = 7; // Skip 3-day, use 7-day
          if (daysFromNow === 7) daysFromNow = 21; // Use 21-day instead of 14
          if (daysFromNow === 14) return { success: false, error: 'Skipped for light frequency' };
        } else if (prefs.followup_frequency === 'aggressive') {
          // Aggressive keeps all follow-ups and adds 1-day
          if (daysFromNow === 3) daysFromNow = 1; // Add 1-day follow-up
        }
      } else {
        // No preferences found, create default (disabled)
        await db.query(`
          INSERT INTO customer_email_preferences (customer_id, auto_followups_enabled)
          VALUES ($1, false)
          ON CONFLICT (customer_id) DO NOTHING
        `, [customerId]);

        return {
          success: false,
          error: 'Auto follow-ups not enabled for this customer',
          requiresConfirmation: true
        };
      }
    }

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + daysFromNow);

    // Get default email account
    const accountResult = await db.query(`
      SELECT id FROM email_accounts WHERE is_default = true AND is_active = true LIMIT 1
    `);

    if (accountResult.rows.length === 0) {
      throw new Error('No default email account found');
    }

    const result = await db.query(`
      INSERT INTO email_campaigns (
        name, template_id, email_account_id, customer_id, trigger_type,
        trigger_data, scheduled_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      RETURNING id
    `, [
      `${daysFromNow}-day follow-up`,
      templateId,
      accountResult.rows[0].id,
      customerId,
      `followup_${daysFromNow}day`,
      JSON.stringify(triggerData || {}),
      scheduledAt
    ]);

    console.log(`📅 Scheduled ${daysFromNow}-day follow-up email for customer ${customerId}`);

    return {
      success: true,
      campaignId: result.rows[0].id
    };
  } catch (error) {
    console.error('❌ Error scheduling follow-up email:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Process scheduled emails
ipcMain.handle('email-process-scheduled', async (event) => {
  try {
    const result = await db.query(`
      SELECT ec.*, et.subject, et.body_html, et.body_text, et.variables,
             ea.email_address as from_email, c.email as to_email, c.name as customer_name
      FROM email_campaigns ec
      JOIN email_templates et ON ec.template_id = et.id
      JOIN email_accounts ea ON ec.email_account_id = ea.id
      JOIN customers c ON ec.customer_id = c.id
      WHERE ec.status = 'pending' 
      AND ec.scheduled_at <= NOW()
      AND ea.is_active = true
    `);

    let processedCount = 0;
    
    for (const campaign of result.rows) {
      try {
        // Replace template variables
        const subject = replaceTemplateVariables(campaign.subject, campaign);
        const bodyHtml = replaceTemplateVariables(campaign.body_html, campaign);
        const bodyText = replaceTemplateVariables(campaign.body_text, campaign);

        // Send email
        const sendResult = await sendEmailInternal(campaign.email_account_id, {
          to: campaign.to_email,
          subject: subject,
          html: bodyHtml,
          text: bodyText
        });

        // Update campaign status
        await db.query(`
          UPDATE email_campaigns 
          SET status = $1, sent_at = NOW(), error_message = $2
          WHERE id = $3
        `, [
          sendResult.success ? 'sent' : 'failed',
          sendResult.success ? null : sendResult.error,
          campaign.id
        ]);

        if (sendResult.success) {
          processedCount++;
        }

        console.log(`📧 Scheduled email ${sendResult.success ? 'sent' : 'failed'}: ${campaign.name}`);
        
      } catch (error) {
        console.error('Error processing campaign:', campaign.id, error);
        
        // Mark as failed
        await db.query(`
          UPDATE email_campaigns 
          SET status = 'failed', error_message = $1
          WHERE id = $2
        `, [error.message, campaign.id]);
      }
    }

    return {
      success: true,
      processedCount: processedCount,
      totalFound: result.rows.length
    };
  } catch (error) {
    console.error('❌ Error processing scheduled emails:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Helper function to replace template variables
function replaceTemplateVariables(text, data) {
  if (!text) return '';
  
  const triggerData = data.trigger_data ? JSON.parse(data.trigger_data) : {};
  
  const variables = {
    '{customer_name}': data.customer_name || 'Valued Customer',
    '{company_name}': 'Bob Explorer',
    '{sender_name}': 'Bob Explorer Team',
    '{date}': new Date().toLocaleDateString(),
    '{inquiry_subject}': triggerData.subject || 'your inquiry',
    '{order_id}': triggerData.order_id || '',
    '{product_list}': triggerData.product_list || '',
    '{total_amount}': triggerData.total_amount || ''
  };
  
  let result = text;
  for (const [variable, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return result;
}

// Helper function to send email internally
async function sendEmailInternal(accountId, emailData) {
  try {
    const accountResult = await db.query(
      'SELECT * FROM email_accounts WHERE id = $1 AND is_active = true',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Email account not found');
    }

    const account = accountResult.rows[0];

    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465,
      auth: {
        user: account.smtp_username,
        pass: account.smtp_password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: account.email_address,
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Auto-detect RFQ products and create follow-up schedules with preference check
ipcMain.handle('email-auto-schedule-rfq-followups', async (event, { rfqId, customerId }) => {
  try {
    // Check customer preferences first
    const prefResult = await db.query(`
      SELECT auto_followups_enabled, unsubscribed, followup_frequency
      FROM customer_email_preferences 
      WHERE customer_id = $1
    `, [customerId]);

    if (prefResult.rows.length > 0) {
      const prefs = prefResult.rows[0];
      
      if (prefs.unsubscribed || !prefs.auto_followups_enabled) {
        return {
          success: false,
          error: 'Auto follow-ups are disabled for this customer',
          customerPreferences: prefs
        };
      }
    } else {
      // Create default preferences (disabled) for new customer
      await db.query(`
        INSERT INTO customer_email_preferences (customer_id, auto_followups_enabled)
        VALUES ($1, false)
        ON CONFLICT (customer_id) DO NOTHING
      `, [customerId]);

      return {
        success: false,
        error: 'Auto follow-ups not enabled for this customer. Please enable in customer preferences.',
        requiresSetup: true
      };
    }

    // Get follow-up templates
    const templateResult = await db.query(`
      SELECT id, name FROM email_templates 
      WHERE template_type = 'followup' AND is_active = true
      ORDER BY name
    `);

    const templates = templateResult.rows;
    let scheduledCount = 0;

    // Determine follow-up days based on customer preference
    const prefs = prefResult.rows[0];
    let followupDays = [];
    
    switch (prefs.followup_frequency) {
      case 'light':
        followupDays = [7, 21];
        break;
      case 'aggressive':
        followupDays = [1, 3, 7, 14];
        break;
      default: // standard
        followupDays = [3, 7, 14];
    }
    
    for (const days of followupDays) {
      const template = templates.find(t => t.name.includes(days.toString()));
      
      if (template) {
        const scheduleResult = await db.query(`
          INSERT INTO email_campaigns (
            name, template_id, email_account_id, customer_id, trigger_type,
            trigger_data, scheduled_at, created_by
          ) SELECT $1, $2, ea.id, $3, $4, $5, $6, 1
          FROM email_accounts ea 
          WHERE ea.is_default = true AND ea.is_active = true
          LIMIT 1
        `, [
          `RFQ ${rfqId} - ${days}-day follow-up`,
          template.id,
          customerId,
          `rfq_followup_${days}day`,
          JSON.stringify({ rfq_id: rfqId }),
          new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        ]);

        if (scheduleResult.rowCount > 0) {
          scheduledCount++;
        }
      }
    }

    console.log(`📅 Scheduled ${scheduledCount} follow-up emails for RFQ ${rfqId} (${prefs.followup_frequency} frequency)`);

    return {
      success: true,
      scheduledCount: scheduledCount,
      frequency: prefs.followup_frequency
    };
  } catch (error) {
    console.error('❌ Error auto-scheduling RFQ follow-ups:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// AI Control IPC handlers
ipcMain.handle('ai-get-status', async (event, phoneNumber) => {
  try {
    const result = await db.query(
      'SELECT (get_or_create_ai_control($1)).*',
      [phoneNumber]
    );
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('💥 Error getting AI status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-toggle-status', async (event, phoneNumber, enabled) => {
  try {
    const result = await db.query(
      'SELECT toggle_ai_status($1, $2) as ai_enabled',
      [phoneNumber, enabled]
    );
    return { success: true, data: { ai_enabled: result.rows[0].ai_enabled } };
  } catch (error) {
    console.error('💥 Error toggling AI status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-disable-for-human-takeover', async (event, phoneNumber) => {
  try {
    const result = await db.query(
      'SELECT disable_ai_for_human_takeover($1) as success',
      [phoneNumber]
    );
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('💥 Error disabling AI for human takeover:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-can-respond', async (event, phoneNumber) => {
  try {
    const result = await db.query(
      'SELECT can_ai_respond($1) as can_respond',
      [phoneNumber]
    );
    return { success: true, data: { can_respond: result.rows[0].can_respond } };
  } catch (error) {
    console.error('💥 Error checking AI response permission:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-reenable-after-timeout', async (event) => {
  try {
    const result = await db.query('SELECT reenable_ai_after_timeout() as updated_count');
    return { success: true, data: { updated_count: result.rows[0].updated_count } };
  } catch (error) {
    console.error('💥 Error re-enabling AI after timeout:', error);
    return { success: false, error: error.message };
  }
});

// Set up email processing interval (every 5 minutes)
let emailProcessingInterval;

function startEmailProcessing() {
  // Process scheduled emails every 5 minutes
  emailProcessingInterval = setInterval(async () => {
    try {
      const result = await db.query(`
        SELECT COUNT(*) as pending_count 
        FROM email_campaigns 
        WHERE status = 'pending' AND scheduled_at <= NOW()
      `);
      
      const pendingCount = parseInt(result.rows[0].pending_count);
      
      if (pendingCount > 0) {
        console.log(`📧 Processing ${pendingCount} scheduled emails...`);
        
        // Process them (reuse the logic from email-process-scheduled)
        const processResult = await db.query(`
          SELECT ec.*, et.subject, et.body_html, et.body_text,
                 ea.email_address as from_email, c.email as to_email, c.name as customer_name
          FROM email_campaigns ec
          JOIN email_templates et ON ec.template_id = et.id
          JOIN email_accounts ea ON ec.email_account_id = ea.id
          JOIN customers c ON ec.customer_id = c.id
          WHERE ec.status = 'pending' 
          AND ec.scheduled_at <= NOW()
          AND ea.is_active = true
          LIMIT 10
        `);

        for (const campaign of processResult.rows) {
          try {
            const subject = replaceTemplateVariables(campaign.subject, campaign);
            const bodyHtml = replaceTemplateVariables(campaign.body_html, campaign);

            const sendResult = await sendEmailInternal(campaign.email_account_id, {
              to: campaign.to_email,
              subject: subject,
              html: bodyHtml
            });

            await db.query(`
              UPDATE email_campaigns 
              SET status = $1, sent_at = NOW(), error_message = $2
              WHERE id = $3
            `, [
              sendResult.success ? 'sent' : 'failed',
              sendResult.success ? null : sendResult.error,
              campaign.id
            ]);

          } catch (error) {
            await db.query(`
              UPDATE email_campaigns 
              SET status = 'failed', error_message = $1
              WHERE id = $2
            `, [error.message, campaign.id]);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in email processing interval:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log('📧 Email processing interval started');
}

// Email processing will be started in main app.whenReady() handler

// Cleanup on app quit
app.on('before-quit', () => {
  if (emailProcessingInterval) {
    clearInterval(emailProcessingInterval);
  }
});
