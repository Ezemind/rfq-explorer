const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function clearAllData() {
  try {
    console.log('🧹 Clearing all chat sessions and RFQ data...');
    
    // Clear chat messages
    const messagesResult = await pool.query('DELETE FROM chat_messages');
    console.log(`✅ Deleted ${messagesResult.rowCount} chat messages`);
    
    // Clear chat sessions
    const sessionsResult = await pool.query('DELETE FROM chat_sessions');
    console.log(`✅ Deleted ${sessionsResult.rowCount} chat sessions`);
    
    // Clear RFQ products
    const productsResult = await pool.query('DELETE FROM rfq_products');
    console.log(`✅ Deleted ${productsResult.rowCount} RFQ products`);
    
    // Clear RFQ requests
    const rfqResult = await pool.query('DELETE FROM rfq_requests');
    console.log(`✅ Deleted ${rfqResult.rowCount} RFQ requests`);
    
    // Clear customers (optional - comment out if you want to keep customer records)
    const customersResult = await pool.query('DELETE FROM customers');
    console.log(`✅ Deleted ${customersResult.rowCount} customers`);
    
    // Clear customer notes
    const notesResult = await pool.query('DELETE FROM customer_notes');
    console.log(`✅ Deleted ${notesResult.rowCount} customer notes`);
    
    // Reset auto-increment sequences
    await pool.query('ALTER SEQUENCE chat_messages_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE chat_sessions_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE rfq_requests_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE rfq_products_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE customers_id_seq RESTART WITH 1');
    console.log('✅ Reset all ID sequences');
    
    console.log('\n🎉 Database cleared successfully! Ready for fresh testing.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await pool.end();
  }
}

clearAllData();
