const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkLatestAudio() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query(`
      SELECT id, message_text, message_type, media_url, metadata, created_at 
      FROM chat_messages 
      WHERE id >= 107
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('Latest audio messages:');
    result.rows.forEach(row => {
      console.log('\n=== MESSAGE ID:', row.id, '===');
      console.log('Text:', row.message_text);
      console.log('Type:', row.message_type);
      console.log('Media URL:', row.media_url || 'NULL');
      console.log('Created:', row.created_at);
      
      if (row.metadata) {
        try {
          const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          console.log('Source:', metadata.source);
          console.log('Original payload keys:', Object.keys(metadata.original_payload || {}));
          
          if (metadata.original_payload && metadata.original_payload.audio_id) {
            console.log('Audio ID from payload:', metadata.original_payload.audio_id);
          }
          
          if (metadata.original_payload && metadata.original_payload.whatsapp_response) {
            console.log('WhatsApp response type:', typeof metadata.original_payload.whatsapp_response);
          }
          
        } catch (e) {
          console.log('Metadata parsing error:', e.message);
        }
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLatestAudio();
