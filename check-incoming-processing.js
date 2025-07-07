const axios = require('axios');

async function checkIncomingWebhookProcessing() {
  console.log('🔍 ANALYZING INCOMING WEBHOOK PROCESSING');
  console.log('======================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  try {
    // Check health and media mappings
    const healthResponse = await axios.get(`${webhookBaseUrl}/health`);
    console.log('Current status:');
    console.log('- Database:', healthResponse.data.database);
    console.log('- Google Drive:', healthResponse.data.googleDrive);
    console.log('- Media Mappings:', healthResponse.data.mediaMappings);
    console.log('- Version:', healthResponse.data.version);
    
    console.log('\n📊 ANALYSIS:');
    console.log('============');
    
    if (healthResponse.data.mediaMappings === 0) {
      console.log('❌ ISSUE: No media mappings stored');
      console.log('This means the incoming WhatsApp webhook is NOT processing audio immediately');
      console.log('');
      console.log('🎯 THE PROBLEM:');
      console.log('- Audio comes in from WhatsApp');
      console.log('- Webhook receives it but doesn\'t process immediately');
      console.log('- N8N gets triggered later with audio_id');
      console.log('- By then, audio_id has expired');
      console.log('');
      console.log('🔧 THE SOLUTION:');
      console.log('- Modify incoming webhook to process audio IMMEDIATELY');
      console.log('- Store in Google Drive when first received');
      console.log('- Create mapping for N8N to find later');
    } else {
      console.log('✅ Media mappings found - immediate processing is working');
      console.log('The issue might be elsewhere');
    }
    
    console.log('\n🧪 RECOMMENDATION:');
    console.log('==================');
    console.log('Send a fresh WhatsApp audio message and check logs for:');
    console.log('1. "⚡ IMMEDIATE PROCESSING: audio [media_id]"');
    console.log('2. "✅ Audio uploaded to Google Drive"');
    console.log('3. "📋 Stored media mapping"');
    console.log('');
    console.log('If these don\'t appear, the incoming webhook needs fixing.');
    
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

checkIncomingWebhookProcessing();
