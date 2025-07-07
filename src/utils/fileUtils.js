// Utility functions for file handling in Electron IPC context

/**
 * Convert a File object to a transferable format for Electron IPC
 * @param {File} file - The File object to convert
 * @returns {Promise<Object>} - Transferable file data
 */
export const convertFileForIPC = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: event.target.result, // This will be an ArrayBuffer
        // Additional metadata
        extension: file.name.split('.').pop().toLowerCase(),
        isImage: file.type.startsWith('image/'),
        isVideo: file.type.startsWith('video/'),
        isAudio: file.type.startsWith('audio/'),
        isDocument: file.type.includes('pdf') || file.type.includes('word') || file.type.includes('excel')
      });
    };
    
    reader.onerror = (error) => {
      reject(new Error(`Failed to read file: ${error.message}`));
    };
    
    // Read the file as ArrayBuffer (binary data)
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate file before processing
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export const validateFile = (file) => {
  // Check file size (50MB limit)
  if (file.size > 50 * 1024 * 1024) {
    return { 
      valid: false, 
      error: 'File size must be less than 50MB' 
    };
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return { 
      valid: false, 
      error: 'File is empty' 
    };
  }
  
  // Check file type
  const allowedTypes = [
    'image/', 'video/', 'audio/', 
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
  
  const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
  if (!isAllowed) {
    return { 
      valid: false, 
      error: 'File type not supported. Please use images, videos, audio, documents, or archives.' 
    };
  }
  
  return { valid: true };
};

/**
 * Get file icon based on file type
 * @param {string} fileType - MIME type of the file
 * @returns {string} - Emoji icon
 */
export const getFileIconEmoji = (fileType) => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel')) return '📊';
  if (fileType.includes('powerpoint')) return '📊';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
  if (fileType.includes('text')) return '📝';
  return '📎';
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Create a file preview URL for images
 * @param {File} file - Image file
 * @returns {Promise<string>} - Object URL or data URL
 */
export const createFilePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Safe file sending wrapper that handles IPC conversion
 * @param {Object} messageData - Message data with file
 * @param {Function} sendFunction - The actual send function
 * @returns {Promise<Object>} - Send result
 */
export const safeSendFile = async (messageData, sendFunction) => {
  console.log('🔧 safeSendFile called with:', {
    type: messageData.type,
    hasFile: !!messageData.file,
    fileName: messageData.file?.name
  });
  
  try {
    if (messageData.type === 'file' && messageData.file) {
      console.log('📁 Processing file message...');
      
      // Validate file first
      console.log('✅ Validating file...');
      const validation = validateFile(messageData.file);
      if (!validation.valid) {
        console.error('❌ File validation failed:', validation.error);
        throw new Error(validation.error);
      }
      console.log('✅ File validation passed');
      
      // Convert file to IPC-safe format
      console.log('🔄 Converting file to IPC format...');
      const fileData = await convertFileForIPC(messageData.file);
      console.log('✅ File converted successfully:', {
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        dataSize: fileData.data?.byteLength || 0
      });
      
      // Create new message data with converted file
      const safeMessageData = {
        ...messageData,
        file: fileData,
        originalFile: undefined // Remove the original File object
      };
      
      console.log('📤 Calling original send function with safe data...');
      const result = await sendFunction(safeMessageData);
      console.log('📨 Original send function result:', result);
      
      return result;
    } else {
      // No file, send as normal
      console.log('💬 Sending text message normally...');
      return await sendFunction(messageData);
    }
  } catch (error) {
    console.error('❌ SafeSendFile error:', error);
    throw error;
  }
};