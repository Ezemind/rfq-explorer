const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkChatMessages() {
  try {
    console.log('💬 Checking recent chat messages for 27744203713...');
    const messages = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE customer_phone = '27744203713' 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('Recent messages:');
    console.log(JSON.stringify(messages.rows, null, 2));
    
    console.log('\n👤 Checking customer record...');
    const customer = await pool.query(`
      SELECT * FROM customers 
      WHERE phone = '27744203713'
    `);
    console.log('Customer record:');
    console.log(JSON.stringify(customer.rows, null, 2));
    
    console.log('\n🔄 Checking n8n chat histories...');
    const n8nHistory = await pool.query(`
      SELECT * FROM n8n_chat_histories 
      WHERE customer_phone = '27744203713' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('N8N Chat histories:');
    console.log(JSON.stringify(n8nHistory.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkChatMessages();
