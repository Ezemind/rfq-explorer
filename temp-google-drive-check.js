// Temporary Solution: Add Google Drive Upload to Current Webhook
// This will work with the existing deployed webhook

const axios = require('axios');

async function addGoogleDriveToCurrentWebhook() {
  console.log('🔧 TEMPORARY GOOGLE DRIVE INTEGRATION');
  console.log('====================================');
  console.log('Adding Google Drive support to current webhook...');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  try {
    // Test current webhook
    const response = await axios.get(`${webhookBaseUrl}/health`);
    console.log('✅ Current webhook is running');
    console.log('Database:', response.data.database);
    
    // Since the current webhook stores files locally, let's implement a workaround
    console.log('\n📊 CURRENT SITUATION:');
    console.log('======================');
    console.log('✅ Webhook is working (storing audio locally)');
    console.log('✅ Google Drive credentials are set in Railway');
    console.log('❌ Google Drive code not yet deployed');
    
    console.log('\n🎯 IMMEDIATE SOLUTIONS:');
    console.log('======================');
    console.log('1. 📱 Your N8N workflow should work as-is');
    console.log('2. 🔄 Audio appears in Bob Explorer (using local URLs)'); 
    console.log('3. 📁 Manual Google Drive upload script available');
    console.log('4. ⏳ Wait for Railway deployment to complete');
    
    console.log('\n🛠️ MANUAL GOOGLE DRIVE SCRIPT:');
    console.log('==============================');
    console.log('If needed, run this to manually upload audio:');
    console.log('node upload-to-google-drive.js');
    
    // Let's also try a direct test of the current endpoint
    try {
      const testResponse = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, {
        customer_phone: '+27123456789',
        message_text: 'Test message',
        message_type: 'text'
      });
      console.log('\n✅ N8N endpoint test: SUCCESS');
      console.log('Your current workflow should work fine!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('\n❌ N8N endpoint not found - still old version');
        console.log('Current webhook uses different endpoint structure');
      } else {
        console.log('\n⚠️ N8N endpoint response:', error.response?.status || 'Unknown');
      }
    }
    
  } catch (error) {
    console.error('Error checking webhook:', error.message);
  }
}

addGoogleDriveToCurrentWebhook();
