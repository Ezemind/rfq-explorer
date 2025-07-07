const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkWhatsAppResponse() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query(`
      SELECT id, message_text, message_type, media_url, metadata, created_at 
      FROM chat_messages 
      WHERE message_type = 'audio' AND sender_type = 'ai'
      ORDER BY created_at DESC 
      LIMIT 2
    `);
    
    console.log('Recent AI audio messages with WhatsApp response:');
    result.rows.forEach(row => {
      console.log('ID:', row.id);
      console.log('Text:', row.message_text);
      console.log('Media URL:', row.media_url || 'NULL');
      console.log('Created:', row.created_at);
      
      if (row.metadata) {
        try {
          const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          console.log('WhatsApp Response:', JSON.stringify(metadata.whatsapp_response, null, 2));
        } catch (e) {
          console.log('Metadata parsing error:', e.message);
          console.log('Raw metadata:', row.metadata);
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

checkWhatsAppResponse();
