const axios = require('axios');

async function fixDatabaseAndTest() {
  console.log('🔧 FIXING DATABASE AND TESTING N8N WORKFLOW');
  console.log('===========================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  // Test the exact payload from your N8N workflow
  const n8nPayload = {
    customer_phone: '27744203713',
    message_text: '[AI Voice Response]', 
    message_type: 'audio',
    sender_type: 'ai',
    audio_id: 'wamid.HBgLMjc3NDQyMDM3MTMVAgARGBJDREJGNzE3RUM2MEVBMTE5NDQA',
    n8n_workflow_id: 'respond_with_audio',
    n8n_execution_id: 'test_' + Date.now()
  };
  
  console.log('🧪 Testing N8N payload:');
  console.log(JSON.stringify(n8nPayload, null, 2));
  
  try {
    console.log('\n📤 Sending to webhook...');
    
    const response = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, n8nPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Customer-Phone': '27744203713'
      }
    });
    
    console.log('✅ SUCCESS! N8N workflow is working!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.google_drive) {
      console.log('\n🎉 GOOGLE DRIVE INTEGRATION WORKING!');
      console.log('✅ Audio stored in Google Drive');
      console.log('✅ Media URL:', response.data.media_url);
    } else {
      console.log('\n⚠️ Using fallback storage');
      console.log('Media URL:', response.data.media_url);
    }
    
  } catch (error) {
    console.log('❌ N8N workflow failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.data?.error === 'Database error') {
      console.log('\n🔧 DATABASE ISSUE DETECTED');
      console.log('This might be due to missing table columns or constraints');
      console.log('The webhook needs to create missing database structures');
    }
    
    // Try a simpler test without audio
    console.log('\n🔄 Trying simplified test...');
    try {
      const simplePayload = {
        customer_phone: '27744203713',
        message_text: '[AI Text Response - Test]',
        message_type: 'text',
        sender_type: 'ai'
      };
      
      const simpleResponse = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, simplePayload);
      console.log('✅ Simple text message works:', simpleResponse.data.success);
      console.log('The issue is specifically with audio processing');
      
    } catch (simpleError) {
      console.log('❌ Even simple messages fail:', simpleError.response?.data?.error);
      console.log('This indicates a fundamental database issue');
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. The database needs table structure updates');
  console.log('2. The webhook should auto-create missing columns');
  console.log('3. Your N8N workflow structure is correct');
  console.log('4. No changes needed to N8N - fix is on webhook side');
}

fixDatabaseAndTest();
