const axios = require('axios');

async function diagnoseTwoIssues() {
  console.log('🔍 DIAGNOSING TWO CRITICAL ISSUES');
  console.log('=================================');
  
  console.log('\n📊 ISSUE 1: Incoming Audio Not Uploaded to Google Drive');
  console.log('======================================================');
  console.log('✅ Symptom: Audio plays in Bob Explorer (stored locally)');
  console.log('❌ Problem: Not uploaded to Google Drive immediately');
  console.log('🔍 Diagnosis: Check Railway logs for debug output');
  
  console.log('\n📊 ISSUE 2: N8N Not Getting Media URL');
  console.log('=====================================');
  console.log('❌ Current: audio_id sent, media_url: null returned');
  console.log('❌ Result: AI response shows "Audio file not available"');
  
  console.log('\n🔧 SOLUTION FOR ISSUE 2: Fix N8N Payload');
  console.log('========================================');
  
  const currentPayload = {
    "customer_phone": "27744203713",
    "message_type": "audio",
    "message_text": "[AI Voice Response]",
    "audio_data": "{{ $('Respond with Audio').item.binary.data.data }}",
    "filename": "ai_response.ogg",
    "content_type": "audio/ogg"
  };
  
  console.log('CHANGE YOUR N8N PAYLOAD TO:');
  console.log(JSON.stringify(currentPayload, null, 2));
  
  console.log('\n🎯 WHY THIS WORKS:');
  console.log('=================');
  console.log('✅ Sends actual audio data (base64) instead of expired audio_id');
  console.log('✅ Webhook uploads directly to Google Drive');
  console.log('✅ Returns proper media_url');
  console.log('✅ Audio response will work in Bob Explorer');
  
  console.log('\n🔧 SOLUTION FOR ISSUE 1: Debug Incoming Processing');
  console.log('=================================================');
  console.log('We need to see why incoming audio isn\'t uploaded to Google Drive');
  console.log('Check Railway logs for messages like:');
  console.log('- "🔍 DEBUG - Processing message"');
  console.log('- "⚠️ IMMEDIATE PROCESSING SKIPPED"'); 
  console.log('- Any error messages');
  
  // Test the webhook to see current status
  try {
    const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
    const healthResponse = await axios.get(`${webhookBaseUrl}/health`);
    
    console.log('\n📊 CURRENT WEBHOOK STATUS:');
    console.log('==========================');
    console.log('Database:', healthResponse.data.database);
    console.log('Google Drive:', healthResponse.data.googleDrive);
    console.log('Media Mappings:', healthResponse.data.mediaMappings);
    console.log('Version:', healthResponse.data.version);
    
    if (healthResponse.data.mediaMappings === 0) {
      console.log('\n❌ CONFIRMED: No media mappings stored');
      console.log('This means incoming WhatsApp audio is NOT being processed immediately');
    }
    
  } catch (error) {
    console.log('❌ Error checking webhook:', error.message);
  }
  
  console.log('\n🎯 IMMEDIATE ACTIONS:');
  console.log('====================');
  console.log('1. Check Railway logs for debug output from your voice message');
  console.log('2. Update N8N payload to use binary audio data');
  console.log('3. Test N8N workflow with new payload');
  console.log('4. Fix incoming audio processing based on debug logs');
}

diagnoseTwoIssues();
