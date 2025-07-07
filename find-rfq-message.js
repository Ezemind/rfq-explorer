const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function findRFQMessage() {
  try {
    console.log('🔍 Looking for recent text messages...');
    const textMessages = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE message_type = 'text' 
      AND created_at > '2025-06-30 12:00:00'
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    console.log('Recent text messages:');
    console.log(JSON.stringify(textMessages.rows, null, 2));
    
    console.log('\n🔍 Looking for messages containing RFQ or quote...');
    const rfqMessages = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE (message_text ILIKE '%rfq%' OR message_text ILIKE '%quote%' OR message_text ILIKE '%BS50DU%')
      AND created_at > '2025-06-30 10:00:00'
      ORDER BY created_at DESC
    `);
    console.log('RFQ/Quote related messages:');
    console.log(JSON.stringify(rfqMessages.rows, null, 2));
    
    console.log('\n🔍 All your messages since RFQ was created...');
    const allYourMessages = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE customer_phone = '27744203713' 
      AND created_at >= '2025-06-30 11:20:00'
      ORDER BY created_at DESC
    `);
    console.log('All messages since RFQ time:');
    console.log(JSON.stringify(allYourMessages.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

findRFQMessage();
