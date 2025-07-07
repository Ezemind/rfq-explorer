const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function updateWithTestAudio() {
  try {
    await client.connect();
    
    // Use a working test audio URL
    const testAudioUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
    
    await client.query('UPDATE chat_messages SET media_url = $1 WHERE id = 109', [testAudioUrl]);
    console.log('✅ Updated message 109 with test audio URL');
    console.log('🎵 URL:', testAudioUrl);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateWithTestAudio();
