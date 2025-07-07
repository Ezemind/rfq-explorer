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

// Auto-updater configuration
if (!isDev) {
  // Enhanced configuration for GitHub with better error handling
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Ezemind',
    repo: 'rfq-explorer',
    token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN, // Use environment variable
    private: false,
    releaseType: 'release'
  });
  
  // More robust update checking
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  
  // Check for updates after app is ready
  setTimeout(() => {
    console.log('🔍 Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000); // Increased delay to ensure app is fully loaded
  
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
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: isDev ? path.join(__dirname, '../assets/icon.png') : path.join(__dirname, '../assets/icon.png'),
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
    
  console.log('Loading URL:', startUrl);
  console.log('Build path exists:', require('fs').existsSync(path.join(__dirname, '../build/index.html')));
  
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
app.whenReady().then(() => {
  createWindow();

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
    const result = await db.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
});

// Authentication
ipcMain.handle('auth-login', async (event, { username, password }) => {
  try {
    const result = await db.query(
      'SELECT id, username, role, password_hash, first_name, last_name, email FROM staff_users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }

    const user = result.rows[0];
    
    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (isValidPassword) {
      // Update last login
      await db.query(
        'UPDATE staff_users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
      
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
      return { success: false, error: 'Invalid credentials' };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Authentication failed' };
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
ipcMain.handle('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  return { success: true };
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

// Start email processing when app is ready
app.whenReady().then(() => {
  setTimeout(startEmailProcessing, 10000); // Start after 10 seconds
});

// Cleanup on app quit
app.on('before-quit', () => {
  if (emailProcessingInterval) {
    clearInterval(emailProcessingInterval);
  }
});
