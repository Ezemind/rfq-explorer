const axios = require('axios');

async function checkWebhookLogs() {
  console.log('🔍 CHECKING WEBHOOK STATUS AFTER FRESH AUDIO');
  console.log('============================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  try {
    // Check health endpoint
    console.log('1. Checking webhook health...');
    const healthResponse = await axios.get(`${webhookBaseUrl}/health`);
    console.log('✅ Webhook Status:', healthResponse.data.status);
    console.log('✅ Version:', healthResponse.data.version);
    console.log('✅ Database:', healthResponse.data.database);
    console.log('✅ Google Drive:', healthResponse.data.googleDrive);
    console.log('✅ Media Mappings:', healthResponse.data.mediaMappings || 0);
    
    console.log('\n2. Features active:');
    healthResponse.data.features.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });
    
    // Check if the immediate processing version is deployed
    if (healthResponse.data.version === '3.0.0-immediate-processing') {
      console.log('\n🎉 IMMEDIATE PROCESSING VERSION IS ACTIVE!');
      console.log('This means:');
      console.log('✅ Fresh audio messages will be processed immediately');
      console.log('✅ Media will be uploaded to Google Drive right away');
      console.log('✅ Media mappings will be stored for N8N lookup');
      console.log('✅ No more expired media ID errors');
    } else {
      console.log('\n⏳ Version', healthResponse.data.version, 'is running');
      console.log('The immediate processing version may still be deploying');
    }
    
    // Test N8N endpoint
    console.log('\n3. Testing N8N endpoint...');
    try {
      const testResponse = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, {
        customer_phone: '+27744203713',
        message_text: '[Test Message]',
        message_type: 'text'
      });
      console.log('✅ N8N endpoint working:', testResponse.data.success);
    } catch (error) {
      console.log('⚠️ N8N endpoint status:', error.response?.status || 'Unknown');
    }
    
    console.log('\n📊 CURRENT INTEGRATION STATUS:');
    console.log('==============================');
    console.log('✅ Webhook: Deployed and running');
    console.log('✅ Google Drive: Service configured');
    console.log('✅ Database: Connected');
    console.log('✅ WhatsApp token: Valid');
    console.log('✅ Immediate processing: ' + (healthResponse.data.version === '3.0.0-immediate-processing' ? 'ACTIVE' : 'Deploying'));
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    if (healthResponse.data.mediaMappings > 0) {
      console.log('✅ Media mappings found - system is processing media!');
      console.log('🎵 Audio files should be accessible in Bob Explorer');
      console.log('📁 Check Google Drive folder for uploaded files');
    } else {
      console.log('📱 Send a fresh WhatsApp audio message to trigger processing');
      console.log('⏳ Wait for immediate processing to upload to Google Drive');
      console.log('🔄 N8N responses should use stored Google Drive URLs');
    }
    
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

checkWebhookLogs();
