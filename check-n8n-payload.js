const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkN8NPayload() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get the latest AI response with full metadata
    const result = await client.query(`
      SELECT id, message_text, message_type, media_url, metadata, created_at 
      FROM chat_messages 
      WHERE message_text LIKE '%AI Voice Response%' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('\n=== LATEST AI RESPONSE ===');
      console.log('ID:', row.id);
      console.log('Text:', row.message_text);
      console.log('Type:', row.message_type);
      console.log('Media URL:', row.media_url || 'NULL');
      console.log('Created:', row.created_at);
      
      if (row.metadata) {
        try {
          const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          console.log('\n=== METADATA ===');
          console.log('Source:', metadata.source);
          console.log('Original payload:', JSON.stringify(metadata.original_payload || {}, null, 2));
        } catch (e) {
          console.log('Metadata parsing error:', e.message);
        }
      }
    } else {
      console.log('❌ No AI Voice Response found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkN8NPayload();
