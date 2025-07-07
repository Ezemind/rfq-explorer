const axios = require('axios');

async function testGoogleDriveUrlFormats() {
  try {
    console.log('🧪 Testing different Google Drive URL formats...');
    
    // Using a file ID visible in your Drive (ai_response_1751284198361_27744203713.ogg)
    // We'll need to extract the actual Google Drive file ID from your system
    
    console.log('📁 Need to test with actual Google Drive file IDs from your system');
    console.log('From your screenshot, the files are stored in Google Drive');
    console.log('But we need the actual Google Drive file IDs, not just the filenames');
    
    // Test different URL patterns that might work
    const testPatterns = [
      'https://drive.google.com/uc?export=download&id=',
      'https://docs.google.com/uc?export=download&id=',
      'https://drive.google.com/file/d/',
    ];
    
    console.log('🔗 URL patterns to try with real file IDs:');
    testPatterns.forEach((pattern, index) => {
      console.log(`  ${index + 1}. ${pattern}[FILE_ID]`);
    });
    
    console.log('\n💡 To make Google Drive audio work in the app:');
    console.log('1. Get actual Google Drive file IDs (not just filenames)');
    console.log('2. Store these IDs in the database media_url field');
    console.log('3. Or implement Google Drive API integration');
    
    // Test with the URLs currently in your database
    console.log('\n🔍 Let\'s check what Google Drive URLs are actually in your database...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGoogleDriveUrlFormats();
