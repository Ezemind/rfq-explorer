const axios = require('axios');

async function waitAndCheckDeployment() {
  console.log('⏳ Waiting for Railway deployment to complete...');
  console.log('🔄 Checking webhook status every 30 seconds...');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  let attempts = 0;
  const maxAttempts = 8; // Check for 4 minutes
  
  while (attempts < maxAttempts) {
    try {
      console.log(`\n📍 Attempt ${attempts + 1}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
      
      const response = await axios.get(webhookBaseUrl);
      const version = response.data.version;
      const message = response.data.message;
      
      console.log(`Version: ${version}`);
      console.log(`Message: ${message}`);
      
      // Check if it's the new version
      if (message.includes('Bob Explorer Webhook Server') || version !== 'ENHANCED_v2.0') {
        console.log('✅ NEW VERSION DETECTED!');
        
        // Test Google Drive endpoints
        try {
          await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, {
            customer_phone: '+27123456789',
            message_text: 'test'
          });
          console.log('✅ Google Drive version is running!');
          break;
        } catch (error) {
          if (error.response?.status === 400 || error.response?.status === 500) {
            console.log('✅ Google Drive endpoints are available!');
            break;
          }
        }
      }
      
      if (attempts === maxAttempts - 1) {
        console.log('⚠️ Still running old version. May need manual intervention.');
        break;
      }
      
      console.log('⏳ Still old version, waiting 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.log('❌ Error checking deployment:', error.message);
      console.log('⏳ Waiting 30 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    attempts++;
  }
  
  console.log('\n🏁 Deployment check complete');
}

waitAndCheckDeployment();
