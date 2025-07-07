const axios = require('axios');

async function debugWhatsAppMediaAccess() {
  console.log('🔍 DEBUGGING WHATSAPP MEDIA ACCESS');
  console.log('=================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  const problemMediaId = 'wamid.HBgLMjc3NDQyMDM3MTMVAgARGBJDREJGNzE3RUM2MEVBMTE5NDQA';
  
  console.log('Media ID causing issues:', problemMediaId);
  
  // Test the media proxy directly
  console.log('\n1. Testing media proxy directly...');
  try {
    const proxyResponse = await axios.get(`${webhookBaseUrl}/api/media/${problemMediaId}`);
    console.log('✅ Media proxy works!');
  } catch (error) {
    console.log('❌ Media proxy failed:', error.response?.status, error.response?.data?.error);
    
    if (error.response?.status === 400) {
      console.log('🔍 This suggests WhatsApp API authentication or token issue');
    }
  }
  
  console.log('\n2. Checking WhatsApp token configuration...');
  console.log('The webhook should have WHATSAPP_TOKEN environment variable set');
  console.log('Current error suggests: 400 = Bad Request to WhatsApp API');
  
  console.log('\n🎯 LIKELY ISSUES & SOLUTIONS:');
  console.log('============================');
  console.log('❌ Issue 1: WhatsApp access token expired/invalid');
  console.log('   Solution: Update WHATSAPP_TOKEN in Railway environment');
  
  console.log('\n❌ Issue 2: WhatsApp media ID format changed');
  console.log('   Solution: Update media download logic');
  
  console.log('\n❌ Issue 3: WhatsApp API permissions');
  console.log('   Solution: Check WhatsApp Business API access');
  
  console.log('\n🔧 IMMEDIATE FIX OPTIONS:');
  console.log('========================');
  console.log('Option 1: Update WhatsApp token in Railway');
  console.log('Option 2: Use alternative audio upload method');
  console.log('Option 3: Skip Google Drive for now, use local proxy');
  
  console.log('\n📝 Current Status:');
  console.log('- Incoming audio: ✅ Works (local storage)');
  console.log('- AI response audio: ❌ WhatsApp download fails');
  console.log('- Google Drive: ⏳ Ready but no files to upload');
  
  // Test if we can fix this with direct upload
  console.log('\n🔄 Testing alternative approach...');
  try {
    const testResponse = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, {
      customer_phone: '+27744203713',
      message_text: '[AI Voice Response]',
      message_type: 'audio',
      sender_type: 'ai',
      // Skip audio_id to avoid WhatsApp download
      n8n_workflow_id: 'test_fix',
      n8n_execution_id: 'fix_' + Date.now()
    });
    
    console.log('✅ Alternative approach works - message stored without audio_id');
    console.log('Response:', testResponse.data);
    
  } catch (error) {
    console.log('❌ Alternative test failed:', error.response?.data || error.message);
  }
}

debugWhatsAppMediaAccess();
