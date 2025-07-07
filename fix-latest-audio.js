const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function fixLatestAudio() {
  try {
    await client.connect();
    
    // Get the latest AI audio message
    const result = await client.query(`
      SELECT id, metadata 
      FROM chat_messages 
      WHERE message_type = 'audio' AND sender_type = 'ai' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const row = result.rows[0];
    console.log('Latest message ID:', row.id);
    
    // Update with working test audio for now
    const testAudioUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
    await client.query('UPDATE chat_messages SET media_url = $1 WHERE id = $2', [testAudioUrl, row.id]);
    
    console.log('✅ Updated message', row.id, 'with test audio URL');
    console.log('🎵 Test URL:', testAudioUrl);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixLatestAudio();
