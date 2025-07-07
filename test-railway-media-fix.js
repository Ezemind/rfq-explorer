// Test the Railway webhook media fixes
// Run with: node test-railway-media-fix.js

const https = require('https');

async function testUrl(url, description) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        console.log(`   ✅ Status: ${response.statusCode}`);
        console.log(`   📋 Content-Type: ${response.headers['content-type']}`);
        console.log(`   📏 Content-Length: ${response.headers['content-length'] || 'unknown'}`);
        
        if (response.statusCode === 200 && response.headers['content-type']?.includes('json')) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.totalFiles !== undefined) {
              console.log(`   📁 Total media files: ${parsed.totalFiles}`);
              if (parsed.files && parsed.files.length > 0) {
                console.log(`   🎵 Sample files:`, parsed.files.slice(0, 3).map(f => f.name));
              }
            }
          } catch (e) {
            // Not JSON, that's fine
          }
        }
        
        resolve({ url, status: response.statusCode, success: response.statusCode === 200 });
      });
    });

    request.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ url, error: error.message, success: false });
    });

    request.setTimeout(15000, () => {
      console.log(`   ⏱️ Timeout after 15 seconds`);
      request.destroy();
      resolve({ url, error: 'Timeout', success: false });
    });
  });
}

async function testMediaFixes() {
  console.log('🚀 TESTING RAILWAY WEBHOOK MEDIA FIXES\n');
  console.log('⏰ Time:', new Date().toISOString());
  console.log('🎯 Testing after GitHub push and Railway auto-deploy\n');
  
  const tests = [
    {
      url: 'https://bob-explorer-webhook-production.up.railway.app/',
      description: 'Root endpoint health check'
    },
    {
      url: 'https://bob-explorer-webhook-production.up.railway.app/health',
      description: 'Health endpoint with statistics'
    },
    {
      url: 'https://bob-explorer-webhook-production.up.railway.app/api/test/media',
      description: 'NEW: Media accessibility test endpoint'
    },
    {
      url: 'https://bob-explorer-webhook-production.up.railway.app/media/',
      description: 'NEW: Static media directory access'
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const result = await testUrl(test.url, test.description);
    if (result.success) successCount++;
    console.log('');
  }
  
  console.log('📊 SUMMARY:');
  console.log(`✅ Successful tests: ${successCount}/${tests.length}`);
  console.log(`🎯 Expected: Root (200), Health (200), Media Test (200), Static (403/404 is normal)`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Wait 2-3 minutes for Railway deployment to complete');
  console.log('2. Test actual media files once WhatsApp sends new messages');
  console.log('3. Restart Bob3 Electron app to test audio playback');
  console.log('4. Check session 4 (Pieter Kemp) for audio messages');
  
  console.log('\n🎵 AUDIO TESTING:');
  console.log('- New messages will be saved as: /media/audio/{timestamp}_{id}.ogg');
  console.log('- Images will be saved as: /media/image/{timestamp}_{id}.jpg');
  console.log('- Bob3 app should now play audio files successfully!');
}

testMediaFixes().catch(console.error);
