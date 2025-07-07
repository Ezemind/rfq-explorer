const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function updateTimestamp() {
  try {
    await pool.query('UPDATE chat_messages SET created_at = NOW() WHERE id = 175');
    console.log('✅ Updated RFQ message timestamp to current time');
    
    // Also update the chat session
    await pool.query(`
      UPDATE chat_sessions 
      SET last_message_at = NOW(), updated_at = NOW()
      WHERE customer_phone = '27744203713' AND id = 4
    `);
    console.log('✅ Updated chat session timestamp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateTimestamp();
