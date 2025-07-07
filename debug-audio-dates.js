const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function debugAudioAndDates() {
  try {
    console.log('🔍 Debug: Checking audio URLs and dates for your messages...');
    
    const messages = await pool.query(`
      SELECT 
        id,
        message_text,
        message_type,
        sender_type,
        media_url,
        created_at,
        EXTRACT(EPOCH FROM created_at) as unix_timestamp,
        NOW() as current_time,
        EXTRACT(EPOCH FROM NOW()) as current_unix
      FROM chat_messages 
      WHERE customer_phone = '27744203713' 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📅 Date/Time Analysis:');
    console.log('Current DB time:', messages.rows[0]?.current_time);
    console.log('Current Unix timestamp:', messages.rows[0]?.current_unix);
    
    console.log('\n🎵 Audio Message Analysis:');
    messages.rows.forEach((msg, index) => {
      if (msg.message_type === 'audio') {
        console.log(`\n--- Message ${msg.id} ---`);
        console.log('Sender:', msg.sender_type);
        console.log('Created:', msg.created_at);
        console.log('Unix timestamp:', msg.unix_timestamp);
        console.log('Media URL:', msg.media_url);
        console.log('URL type:', msg.media_url?.startsWith('http') ? 'Full URL' : 'Relative path');
        
        if (msg.media_url?.startsWith('/media')) {
          const railwayUrl = `https://bob-explorer-webhook-production.up.railway.app${msg.media_url}`;
          console.log('Should resolve to:', railwayUrl);
        }
      }
    });
    
    console.log('\n🔗 Testing Railway webhook endpoint...');
    // Test if the Railway webhook is accessible
    const axios = require('axios');
    try {
      const response = await axios.get('https://bob-explorer-webhook-production.up.railway.app/health', {
        timeout: 5000
      });
      console.log('✅ Railway webhook is accessible:', response.status);
    } catch (error) {
      console.log('❌ Railway webhook error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugAudioAndDates();
