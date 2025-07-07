require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function checkTableStructures() {
  console.log('🔍 Checking table structures...');
  
  try {
    // Check chat_sessions structure
    const chatSessionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      ORDER BY ordinal_position
    `);
    console.log('💬 chat_sessions table structure:', JSON.stringify(chatSessionsColumns.rows, null, 2));
    
    // Check rfq_requests structure
    const rfqRequestsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'rfq_requests' 
      ORDER BY ordinal_position
    `);
    console.log('📋 rfq_requests table structure:', JSON.stringify(rfqRequestsColumns.rows, null, 2));
    
    // Check rfq_products structure
    const rfqProductsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'rfq_products' 
      ORDER BY ordinal_position
    `);
    console.log('🛍️ rfq_products table structure:', JSON.stringify(rfqProductsColumns.rows, null, 2));
    
    // Check customer_notes structure
    const customerNotesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customer_notes' 
      ORDER BY ordinal_position
    `);
    console.log('📝 customer_notes table structure:', JSON.stringify(customerNotesColumns.rows, null, 2));
    
    // Sample RFQ data
    const sampleRfq = await pool.query('SELECT * FROM rfq_requests LIMIT 3');
    console.log('📋 Sample RFQ requests:', JSON.stringify(sampleRfq.rows, null, 2));
    
    const sampleRfqProducts = await pool.query('SELECT * FROM rfq_products LIMIT 5');
    console.log('🛍️ Sample RFQ products:', JSON.stringify(sampleRfqProducts.rows, null, 2));
    
    const sampleChatSessions = await pool.query('SELECT * FROM chat_sessions LIMIT 3');
    console.log('💬 Sample chat sessions:', JSON.stringify(sampleChatSessions.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructures();