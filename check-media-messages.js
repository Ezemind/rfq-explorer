const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkMediaMessages() {
  try {
    console.log('🔍 Checking recent media messages...');
    
    const messages = await pool.query(`
      SELECT id, message_type, media_url, sender_type, created_at 
      FROM chat_messages 
      WHERE media_url IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Media messages found:', messages.rows.length);
    messages.rows.forEach(msg => {
      console.log(`${msg.message_type} message (ID: ${msg.id}):`);
      console.log('  URL:', msg.media_url);
      console.log('  Sender:', msg.sender_type);
      console.log('  Time:', msg.created_at);
      console.log('---');
    });
    
    // Test if Railway webhook is accessible
    if (messages.rows.length > 0) {
      console.log('\n🔗 Testing Railway webhook accessibility...');
      const axios = require('axios');
      try {
        const response = await axios.head('https://bob-explorer-webhook-production.up.railway.app/health', {
          timeout: 5000
        });
        console.log('✅ Railway webhook accessible:', response.status);
      } catch (error) {
        console.log('❌ Railway webhook error:', error.code || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkMediaMessages();
