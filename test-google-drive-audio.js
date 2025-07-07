const axios = require('axios');

async function testGoogleDriveAudio() {
  try {
    console.log('🧪 Testing Google Drive audio download...');
    
    // Test with one of the Google Drive URLs from your screenshot
    const testUrl = 'https://drive.google.com/uc?id=10Vv_fr0UN4EX4HqjWq_Jb6FpjcvXei3Q&export=download';
    
    console.log('🔗 Testing URL:', testUrl);
    
    // Test the enhanced method with proper headers
    const response = await axios.get(testUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/*,*/*;q=0.9',
        'Referer': 'https://drive.google.com/',
        'Cache-Control': 'no-cache'
      },
      validateStatus: (status) => status < 400
    });
    
    console.log('✅ Response received:');
    console.log('  Status:', response.status);
    console.log('  Content-Type:', response.headers['content-type']);
    console.log('  Content-Length:', response.headers['content-length']);
    console.log('  Data size:', response.data.length, 'bytes');
    
    if (response.data.length > 1000) {
      console.log('✅ Looks like valid audio data (size > 1KB)');
      
      // Convert to base64 to test the full pipeline
      const base64 = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:audio/ogg;base64,${base64}`;
      
      console.log('✅ Successfully converted to base64 data URL');
      console.log('  Data URL length:', dataUrl.length, 'characters');
      console.log('  First 100 chars:', dataUrl.substring(0, 100) + '...');
    } else {
      console.log('⚠️ Response seems too small for audio file:', response.data.length, 'bytes');
      console.log('  Response preview:', response.data.toString().substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error testing Google Drive audio:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
    }
  }
}

testGoogleDriveAudio();
