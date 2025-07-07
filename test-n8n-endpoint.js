const axios = require('axios');

async function testN8NEndpoint() {
  try {
    console.log('🧪 Testing N8N outbound-message endpoint...');
    
    const payload = {
      customer_phone: '27744203713',
      message_text: '[AI Voice Response]',
      message_type: 'audio',
      sender_type: 'ai',
      // This is what n8n should be sending after uploading to Google Drive
      audio_url: 'https://drive.google.com/uc?id=EXAMPLE_FILE_ID&export=download',
      media_url: 'https://drive.google.com/uc?id=EXAMPLE_FILE_ID&export=download',
      n8n_workflow_id: 'test_workflow',
      n8n_execution_id: 'test_execution'
    };

    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://bob-explorer-webhook-production.up.railway.app/api/n8n/outbound-message',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Response:', response.data);
    console.log('📊 Status:', response.status);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testN8NEndpoint();
