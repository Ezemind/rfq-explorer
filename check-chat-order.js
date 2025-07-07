const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkChatOrder() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        cs.id,
        cs.customer_phone,
        cs.updated_at,
        cm.message_text,
        cm.created_at as last_message_time
      FROM chat_sessions cs
      LEFT JOIN LATERAL (
        SELECT message_text, created_at 
        FROM chat_messages 
        WHERE session_id = cs.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) cm ON true
      ORDER BY GREATEST(cs.updated_at, COALESCE(cm.created_at, cs.created_at)) DESC
      LIMIT 5
    `);
    
    console.log('Chat sessions by latest activity:');
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.customer_phone} - Last: ${row.last_message_time || row.updated_at}`);
      console.log(`   Message: ${row.message_text || 'No messages'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkChatOrder();
