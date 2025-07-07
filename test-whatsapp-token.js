// Quick WhatsApp Token Test Script
const axios = require('axios');

async function testWhatsAppToken() {
  console.log('🔍 TESTING WHATSAPP TOKEN');
  console.log('========================');
  
  // The token from your Railway environment (visible in your screenshot)
  const testToken = 'EAANwRHZAVbqoBOx8jKJtdMWKQ4bZCcDEsZA030CKWDZBxgZCbxHixiDLaP7rBBOHSLZBLXNB9f0ZCDsgTUiKZCPtYW3RZBtyDukpzKXZBGzDZCRLh9ZChZAe1xuJo6MFTQrLiha4kKGaURilme72yibjeYt3LsCz5hglufPV1Bp4AeNIFD5qxUP0ZCUTFGTEiCem0NtBplpwZDZD';
  
  console.log('Testing token validity...');
  
  try {
    // Test with a simple WhatsApp API call
    const response = await axios.get('https://graph.facebook.com/v18.0/me', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('✅ Token is VALID!');
    console.log('App info:', response.data);
    
    // Now test with the problematic media ID
    const mediaId = 'wamid.HBgLMjc3NDQyMDM3MTMVAgARGBJDREJGNzE3RUM2MEVBMTE5NDQA';
    console.log('\nTesting problematic media ID...');
    
    try {
      const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log('✅ Media ID is valid!');
      console.log('Media info:', mediaResponse.data);
      
    } catch (mediaError) {
      console.log('❌ Media ID failed:', mediaError.response?.status, mediaError.response?.data);
      
      if (mediaError.response?.status === 400) {
        console.log('🔍 Media ID might be expired or malformed');
      }
    }
    
  } catch (error) {
    console.log('❌ Token is INVALID or EXPIRED!');
    console.log('Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🔧 Solution: Get a new WhatsApp access token');
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. If token is valid but media fails: Media ID might be expired');
  console.log('2. If token is invalid: Generate new token from WhatsApp Business API');
  console.log('3. Update WHATSAPP_TOKEN in Railway environment variables');
  console.log('4. Consider using direct audio upload instead of media ID');
}

testWhatsAppToken();
