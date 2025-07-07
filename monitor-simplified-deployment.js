const axios = require('axios');

async function monitorSimplifiedDeployment() {
  console.log('🔧 MONITORING SIMPLIFIED GOOGLE DRIVE DEPLOYMENT');
  console.log('===============================================');
  console.log('📦 Deployed: webhook-google-drive.js (simplified version)');
  console.log('⏳ Waiting for Railway to deploy...\n');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  let attempts = 0;
  const maxAttempts = 12;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`📍 Check ${attempts + 1}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
      
      // Check root endpoint for new version
      const rootResponse = await axios.get(webhookBaseUrl);
      console.log(`Version: ${rootResponse.data.version || 'unknown'}`);
      console.log(`Message: ${rootResponse.data.message}`);
      
      // Look for Google Drive version indicators
      if (rootResponse.data.version === '2.0.0-google-drive' || 
          rootResponse.data.message.includes('Google Drive Integration')) {
        
        console.log('✅ NEW GOOGLE DRIVE VERSION DETECTED!');
        
        // Test health endpoint
        try {
          const healthResponse = await axios.get(`${webhookBaseUrl}/health`);
          console.log('Database:', healthResponse.data.database);
          console.log('Google Drive:', healthResponse.data.googleDrive);
          
          if (healthResponse.data.googleDrive === 'initialized') {
            console.log('🎉 GOOGLE DRIVE FULLY OPERATIONAL!');
            break;
          } else {
            console.log('⚠️ Google Drive not yet initialized - checking credentials...');
          }
        } catch (healthError) {
          console.log('⚠️ Health check failed, but version is correct');
        }
        
        // Test N8N endpoint
        try {
          await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, {
            customer_phone: '+27123456789',
            message_text: 'test'
          });
          console.log('✅ N8N endpoint working!');
          break;
        } catch (error) {
          if (error.response?.status === 400 || error.response?.status === 500) {
            console.log('✅ N8N endpoint exists and responding!');
            break;
          }
        }
      }
      
      if (attempts === maxAttempts - 1) {
        console.log('⚠️ Deployment taking longer than expected');
        break;
      }
      
      console.log('⏳ Waiting 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
    } catch (error) {
      console.log('❌ Error during check:', error.message);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    
    attempts++;
  }
  
  console.log('\n🏁 DEPLOYMENT CHECK COMPLETE');
  console.log('============================');
  console.log('🎵 Try sending a WhatsApp audio message now!');
  console.log('📁 Check Google Drive folder: 1sxuVD0fNkohgTVc1kEESdqg0ecY6kiWz');
  console.log('💻 Audio should appear in Bob Explorer');
}

monitorSimplifiedDeployment();
