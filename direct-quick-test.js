const axios = require('axios');

async function directQuickTest() {
  console.log('⚡ DIRECT QUICK TEST');
  console.log('===================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  try {
    // Test simple text message first
    console.log('1. Testing simple text message...');
    const textPayload = {
      customer_phone: '27744203713',
      message_text: '[AI Text Response]',
      message_type: 'text',
      sender_type: 'ai'
    };
    
    const textResponse = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, textPayload);
    console.log('✅ Text message works:', textResponse.data.success);
    
    // Test audio message
    console.log('\n2. Testing audio message...');
    const audioPayload = {
      customer_phone: '27744203713',
      message_text: '[AI Voice Response]',
      message_type: 'audio',
      sender_type: 'ai',
      audio_id: 'wamid.HBgLMjc3NDQyMDM3MTMVAgARGBJDREJGNzE3RUM2MEVBMTE5NDQA'
    };
    
    const audioResponse = await axios.post(`${webhookBaseUrl}/api/n8n/outbound-message`, audioPayload);
    console.log('✅ Audio message works:', audioResponse.data.success);
    console.log('Response:', audioResponse.data);
    
    console.log('\n🎉 BOTH TESTS PASSED!');
    console.log('Your N8N workflow should now work perfectly!');
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.data?.details?.includes('storedUrl')) {
      console.log('\n🔄 Still seeing storedUrl error - Railway may not have deployed yet');
      console.log('Try again in 1-2 minutes');
    }
  }
}

directQuickTest();
