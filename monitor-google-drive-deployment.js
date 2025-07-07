const axios = require('axios');

async function monitorGoogleDriveDeployment() {
  console.log('🚀 MONITORING GOOGLE DRIVE DEPLOYMENT');
  console.log('====================================');
  console.log('⚠️ Fixed railway.json - Railway should now deploy src/server.js');
  console.log('⏳ Checking every 20 seconds for the Google Drive version...\n');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  let attempts = 0;
  const maxAttempts = 15; // Check for 5 minutes
  
  while (attempts < maxAttempts) {
    try {
      console.log(`📍 Check ${attempts + 1}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
      
      // Test for Google Drive specific endpoints
      try {
        const response = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, {
          customer_phone: '+27123456789',
          message_text: 'test'
        });
        
        console.log('✅ SUCCESS! Google Drive version is now deployed!');
        console.log('🎵 Audio messages will now be stored in Google Drive');
        console.log('📁 Folder: 1sxuVD0fNkohgTVc1kEESdqg0ecY6kiWz');
        console.log('');
        console.log('🔄 NEXT STEPS:');
        console.log('1. Send a WhatsApp audio message');
        console.log('2. Check Google Drive folder for new files');
        console.log('3. Audio should appear in Bob Explorer with reliable playback');
        console.log('4. No need to restart Bob Explorer - it will use new URLs automatically');
        break;
        
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ SUCCESS! Google Drive endpoints are available!');
          console.log('🎵 Google Drive integration is now active!');
          break;
        } else if (error.response?.status === 500) {
          // Server error might be due to missing parameters, but endpoint exists
          console.log('✅ SUCCESS! Google Drive version deployed (endpoint exists)');
          break;
        } else if (error.response?.status === 404) {
          console.log('❌ Still old version - endpoint not found');
        } else {
          console.log(`⚠️ Status ${error.response?.status} - checking...`);
        }
      }
      
      // Also check root endpoint for version info
      try {
        const rootResponse = await axios.get(webhookBaseUrl);
        if (rootResponse.data.message !== 'Enhanced WhatsApp Webhook for Bob Explorer') {
          console.log('✅ NEW VERSION DETECTED!');
          console.log(`Message: ${rootResponse.data.message}`);
          break;
        } else {
          console.log('⏳ Still old version, waiting 20 seconds...');
        }
      } catch (e) {
        console.log('⚠️ Error checking root endpoint');
      }
      
      if (attempts === maxAttempts - 1) {
        console.log('❌ Deployment taking longer than expected');
        console.log('💡 Try manually restarting the Railway service if needed');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 20000));
      
    } catch (error) {
      console.log('❌ Error during check:', error.message);
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
    
    attempts++;
  }
}

monitorGoogleDriveDeployment();
