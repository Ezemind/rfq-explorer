// Test media URL resolution
console.log('Testing media URL resolution...');

// Test the getMediaUrl function
async function testMediaUrls() {
  if (window.electronAPI && window.electronAPI.getMediaUrl) {
    console.log('ElectronAPI available, testing media URLs...');
    
    const testUrls = [
      'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1048408267398810&ext=1751121593&hash=ARlgLAXVsF3gyqZokIacAsM-H548oqnxIvb0rGcZjHi2aA',
      'media/audio/64_1751112035835.ogg',
      'media/images/62_1751112037234.jpg'
    ];
    
    for (const url of testUrls) {
      try {
        const resolved = await window.electronAPI.getMediaUrl(url);
        console.log(`Input: ${url}`);
        console.log(`Resolved: ${resolved}`);
        console.log('---');
      } catch (error) {
        console.error(`Failed to resolve ${url}:`, error);
      }
    }
  } else {
    console.error('ElectronAPI not available');
  }
}

// Run test after a short delay to ensure everything is loaded
setTimeout(testMediaUrls, 2000);
