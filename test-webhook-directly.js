const axios = require('axios');

async function testWebhookDirectly() {
  console.log('🧪 TESTING WEBHOOK IMMEDIATE PROCESSING DIRECTLY');
  console.log('===============================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  // Simulate a WhatsApp webhook payload with fresh audio
  const whatsappPayload = {
    "entry": [{
      "id": "122145461696793708",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "27123456789",
            "phone_number_id": "122145461696793708"
          },
          "contacts": [{
            "profile": {
              "name": "Test User"
            },
            "wa_id": "27744203713"
          }],
          "messages": [{
            "from": "27744203713",
            "id": "wamid.HBgLMjc3NDQyMDM3MTMVAgARGBJDREJGNzE3RUM2MEVBMTE5NDQA",
            "timestamp": "1719751200",
            "type": "audio",
            "audio": {
              "id": "wamid.HBgLMjc3NDQyMDM3MTMVAgARGBJDREJGNzE3RUM2MEVBMTE5NDQA",
              "mime_type": "audio/ogg; codecs=opus",
              "sha256": "test_sha256"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  };
  
  try {
    console.log('📤 Sending simulated WhatsApp webhook...');
    console.log('This should trigger immediate processing');
    
    const response = await axios.post(`${webhookBaseUrl}/api/whatsapp/webhook`, whatsappPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait a moment then check media mappings
    console.log('\n⏳ Waiting 5 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const healthResponse = await axios.get(`${webhookBaseUrl}/health`);
    console.log('📊 Media mappings after test:', healthResponse.data.mediaMappings);
    
    if (healthResponse.data.mediaMappings > 0) {
      console.log('🎉 SUCCESS! Immediate processing is working!');
      console.log('The issue was that real WhatsApp messages weren\'t triggering it');
    } else {
      console.log('❌ Still no media mappings - immediate processing not triggered');
      console.log('This means the incoming webhook needs debugging');
    }
    
  } catch (error) {
    console.log('❌ Webhook test failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('\n🔍 403 Forbidden - this is expected for test payload');
      console.log('Real WhatsApp messages have proper verification');
    }
  }
}

testWebhookDirectly();
