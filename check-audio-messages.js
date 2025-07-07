require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAudioMessages() {
  try {
    console.log('🎵 Checking audio messages...\n');
    
    const audioMessages = await pool.query(`
      SELECT customer_phone, message_type, media_url, created_at, message_text
      FROM chat_messages 
      WHERE message_type = 'audio' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Recent audio messages:');
    console.log(JSON.stringify(audioMessages.rows, null, 2));
    
    if (audioMessages.rows.length > 0) {
      const testUrl = audioMessages.rows[0].media_url;
      console.log('\n🧪 Testing first audio URL:', testUrl);
      
      // Test direct access
      try {
        const response = await fetch(`https://bob-explorer-webhook-production.up.railway.app/${testUrl}`);
        console.log('Direct access status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
      } catch (error) {
        console.log('Direct access error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAudioMessages();
