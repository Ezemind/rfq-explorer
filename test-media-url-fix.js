const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function testMediaURL() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get the audio_id from the latest AI message
    const latestResult = await client.query(`
      SELECT id, metadata 
      FROM chat_messages 
      WHERE message_type = 'audio' AND sender_type = 'ai' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (latestResult.rows.length > 0) {
      const row = latestResult.rows[0];
      const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      const audioId = metadata.original_payload.audio_id;
      
      console.log('Latest AI message ID:', row.id);
      console.log('Audio ID:', audioId);
      
      // Create the media proxy URL
      const mediaUrl = `https://bob-explorer-webhook-production.up.railway.app/media-proxy/${audioId}`;
      console.log('Media proxy URL:', mediaUrl);
      
      // Update the message with the media URL
      await client.query(`
        UPDATE chat_messages 
        SET media_url = $1 
        WHERE id = $2
      `, [mediaUrl, row.id]);
      
      console.log('✅ Updated message with media URL');
      console.log('🎵 Check your Bob3 app - the latest AI audio should now be playable!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

testMediaURL();
