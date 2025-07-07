// Enhanced media URL debugging for Bob3 with Google Drive support
// src/utils/mediaDebug.js

/**
 * Test if a media URL is accessible
 * @param {string} url - URL to test
 * @returns {Promise<object>} - Test result
 */
export async function testMediaUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    };
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error.message
    };
  }
}

/**
 * Convert Google Drive URL to direct download format
 * @param {string} url - Original Google Drive URL
 * @returns {string} - Direct download URL
 */
export function convertGoogleDriveUrl(url) {
  if (!url) return url;
  
  // If it's already a direct download URL, return as-is
  if (url.includes('drive.google.com/uc?id=') && url.includes('export=download')) {
    return url;
  }
  
  // Extract file ID from various Google Drive URL formats
  let fileId = null;
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  if (url.includes('/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  
  // Format: https://drive.google.com/open?id=FILE_ID
  if (url.includes('open?id=')) {
    const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  
  // Format: https://drive.google.com/uc?id=FILE_ID
  if (url.includes('uc?id=')) {
    const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  
  // If we found a file ID, create direct download URL
  if (fileId) {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }
  
  // Return original URL if no conversion possible
  return url;
}

/**
 * Get alternative media URLs for different types of media files
 * @param {string} originalUrl - Original media URL
 * @returns {Array<string>} - Array of alternative URLs to try
 */
export function getAlternativeMediaUrls(originalUrl) {
  const alternatives = [];
  
  if (!originalUrl) return alternatives;
  
  // Handle Google Drive URLs
  if (originalUrl.includes('drive.google.com')) {
    const convertedUrl = convertGoogleDriveUrl(originalUrl);
    alternatives.push(convertedUrl);
    
    // Also try the original URL
    if (convertedUrl !== originalUrl) {
      alternatives.push(originalUrl);
    }
    
    return alternatives;
  }
  
  // If it's already a full URL, try as-is
  if (originalUrl.startsWith('http')) {
    alternatives.push(originalUrl);
  } else {
    // Try different Railway webhook endpoints for local files
    const baseUrls = [
      'https://bob-explorer-webhook-production.up.railway.app',
    ];
    
    const paths = [
      originalUrl, // Original path
      `/media/${originalUrl}`, // With media prefix
      `/files/${originalUrl}`, // Alternative files endpoint
      `/api/media/${originalUrl}`, // API endpoint
    ];
    
    baseUrls.forEach(baseUrl => {
      paths.forEach(path => {
        // Clean up path to avoid double slashes
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        alternatives.push(`${baseUrl}${cleanPath}`);
      });
    });
  }
  
  return [...new Set(alternatives)]; // Remove duplicates
}

/**
 * Enhanced media URL resolver with Google Drive and fallback testing
 * @param {string} mediaPath - Original media path
 * @returns {Promise<string|null>} - Working URL or null
 */
export async function resolveMediaUrl(mediaPath) {
  if (!mediaPath) return null;
  
  console.log('🔍 Resolving media URL for:', mediaPath);
  
  // For Google Drive URLs, convert and return directly without testing
  // (Testing Google Drive URLs with HEAD requests can be unreliable)
  if (mediaPath.includes('drive.google.com')) {
    const convertedUrl = convertGoogleDriveUrl(mediaPath);
    console.log('✅ Google Drive URL converted:', convertedUrl);
    return convertedUrl;
  }
  
  // For non-Google Drive URLs, test accessibility
  const alternatives = getAlternativeMediaUrls(mediaPath);
  
  for (const url of alternatives) {
    console.log('📡 Testing URL:', url);
    const result = await testMediaUrl(url);
    
    if (result.accessible) {
      console.log('✅ Media URL accessible:', url);
      console.log('   Content-Type:', result.contentType);
      console.log('   Size:', result.contentLength, 'bytes');
      return url;
    } else {
      console.log('❌ Media URL failed:', url, 'Status:', result.status || result.error);
    }
  }
  
  console.log('🚫 No accessible media URL found for:', mediaPath);
  return null;
}

/**
 * Check if a URL is a Google Drive URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's a Google Drive URL
 */
export function isGoogleDriveUrl(url) {
  return url && url.includes('drive.google.com');
}

/**
 * Get media type from URL or content type
 * @param {string} url - Media URL
 * @param {string} contentType - Content type header
 * @returns {string} - Media type (audio, video, image, document)
 */
export function getMediaType(url, contentType) {
  if (contentType) {
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('image/')) return 'image';
  }
  
  if (url) {
    const lower = url.toLowerCase();
    if (lower.includes('.mp3') || lower.includes('.ogg') || lower.includes('.wav') || lower.includes('.m4a')) return 'audio';
    if (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov')) return 'video';
    if (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.gif') || lower.includes('.webp')) return 'image';
  }
  
  return 'document';
}
