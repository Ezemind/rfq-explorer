const axios = require('axios');

async function testWithGoogleDriveURL() {
  try {
    console.log('🧪 Testing with Google Drive URL format...');
    
    // Using the file ID from your screenshot
    const fileId = '1751285919529_27744203713'; // This would be the actual Google Drive file ID
    const googleDriveUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
    
    const payload = {
      customer_phone: '27744203713',
      message_text: '[AI Voice Response]',
      message_type: 'audio',
      sender_type: 'ai',
      media_url: googleDriveUrl,
      n8n_workflow_id: 'test_workflow',
      n8n_execution_id: 'test_execution'
    };

    console.log('📤 Sending payload with Google Drive URL:', JSON.stringify(payload, null, 2));

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

testWithGoogleDriveURL();
