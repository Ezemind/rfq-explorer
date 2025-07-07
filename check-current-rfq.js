const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkCurrentRFQ() {
  try {
    console.log('🔍 Checking RFQ Products for ID 75...');
    const products = await pool.query('SELECT * FROM rfq_products WHERE rfq_id = 75');
    console.log('RFQ Products:');
    console.log(JSON.stringify(products.rows, null, 2));
    
    console.log('\n💬 Checking recent messages for 27744203713...');
    const messages = await pool.query(`
      SELECT * FROM messages 
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
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentRFQ();
