// Test media URL accessibility from Railway webhook
// Run with: node test-media-access.js

const https = require('https');

const testUrls = [
  'https://bob-explorer-webhook-production.up.railway.app/media/audio/64_1751112035835.ogg',
  'https://bob-explorer-webhook-production.up.railway.app/media/images/62_1751112037234.jpg',
  'https://bob-explorer-webhook-production.up.railway.app/api/whatsapp/webhook',
  'https://bob-explorer-webhook-production.up.railway.app/',
];

function testUrl(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      console.log(`✅ ${url}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Content-Length: ${response.headers['content-length'] || 'unknown'}`);
      resolve({ url, status: response.statusCode, success: true });
    });

    request.on('error', (error) => {
      console.log(`❌ ${url}`);
      console.log(`   Error: ${error.message}`);
      resolve({ url, error: error.message, success: false });
    });

    request.setTimeout(10000, () => {
      console.log(`⏱️ ${url}`);
      console.log(`   Timeout after 10 seconds`);
      request.destroy();
      resolve({ url, error: 'Timeout', success: false });
    });
  });
}

async function testAllUrls() {
  console.log('🔍 TESTING RAILWAY WEBHOOK MEDIA ACCESSIBILITY\n');
  
  for (const url of testUrls) {
    await testUrl(url);
    console.log('');
  }
  
  console.log('✅ Media accessibility test complete!');
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('1. If 404 errors: Check Railway webhook implementation');
  console.log('2. If timeout: Railway service may be sleeping');
  console.log('3. If CORS errors: Add CORS headers to webhook');
  console.log('4. Test audio playback in browser developer tools');
}

testAllUrls().catch(console.error);
