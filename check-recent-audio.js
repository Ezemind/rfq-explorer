const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkAudioMessages() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query(`
      SELECT id, message_text, message_type, media_url, metadata, created_at 
      FROM chat_messages 
      WHERE message_type = 'audio' AND sender_type = 'ai'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Recent AI audio messages:');
    result.rows.forEach(row => {
      console.log('ID:', row.id);
      console.log('Text:', row.message_text);
      console.log('Media URL:', row.media_url || 'NULL');
      console.log('Created:', row.created_at);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAudioMessages();
