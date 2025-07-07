const axios = require('axios');

async function checkCurrentWebhookStatus() {
  console.log('🔍 Checking Current Webhook Configuration');
  console.log('=========================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  try {
    // Check current webhook status
    console.log('\n1. Checking webhook version...');
    const rootResponse = await axios.get(webhookBaseUrl);
    console.log('Current version:', rootResponse.data.version);
    console.log('Message:', rootResponse.data.message);
    console.log('Features:', rootResponse.data.features);
    
    // Check health endpoint for more details
    console.log('\n2. Checking detailed health status...');
    const healthResponse = await axios.get(`${webhookBaseUrl}/health`);
    console.log('Service:', healthResponse.data.service);
    console.log('Database:', healthResponse.data.database);
    console.log('Statistics:', healthResponse.data.statistics);
    console.log('Features:', healthResponse.data.features);
    
    // Check if Google Drive endpoints exist
    console.log('\n3. Testing Google Drive specific endpoints...');
    const testEndpoints = [
      '/api/upload/audio',
      '/api/n8n/outbound-message', 
      '/media-proxy/test123'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(`${webhookBaseUrl}${endpoint}`);
        console.log(`✅ ${endpoint}: Available`);
      } catch (error) {
        if (error.response?.status === 405) {
          console.log(`✅ ${endpoint}: Available (POST only)`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${endpoint}: Not found - OLD VERSION DEPLOYED`);
        } else if (error.response?.status === 400) {
          console.log(`✅ ${endpoint}: Available (needs parameters)`);
        } else {
          console.log(`⚠️ ${endpoint}: ${error.response?.status || 'Error'}`);
        }
      }
    }
    
    console.log('\n📊 ANALYSIS:');
    console.log('===========');
    if (rootResponse.data.version === 'ENHANCED_v2.0') {
      console.log('❌ ISSUE FOUND: Still running OLD webhook version');
      console.log('   - Current: webhook-simple.js (local storage)');
      console.log('   - Expected: src/server.js (Google Drive)');
      console.log('   - Action needed: Check Railway deployment');
    } else {
      console.log('✅ Running newer version - checking Google Drive status');
    }
    
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

checkCurrentWebhookStatus();
