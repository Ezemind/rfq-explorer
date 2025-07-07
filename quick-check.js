const axios = require('axios');

async function quickDeploymentCheck() {
  console.log('⚡ Quick Railway Deployment Check');
  console.log('=================================');
  
  const webhookBaseUrl = 'https://bob-explorer-webhook-production.up.railway.app';
  
  try {
    const response = await axios.get(webhookBaseUrl);
    console.log('Current Status:');
    console.log('- Version:', response.data.version);
    console.log('- Message:', response.data.message);
    console.log('- Features:', response.data.features);
    
    if (response.data.version === '2.0.0-google-drive') {
      console.log('✅ Google Drive version is deployed!');
      
      // Test health
      try {
        const health = await axios.get(`${webhookBaseUrl}/health`);
        console.log('- Database:', health.data.database);
        console.log('- Google Drive:', health.data.googleDrive);
      } catch (e) {
        console.log('- Health check failed');
      }
    } else {
      console.log('❌ Still old version - Railway may need more time');
      console.log('💡 Try again in 1-2 minutes, or check Railway logs');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickDeploymentCheck();
