require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkRFQTable() {
  try {
    console.log('🔍 Checking RFQ table structure...');
    
    // Get table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'rfq_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 RFQ requests table structure:');
    console.log(JSON.stringify(structureResult.rows, null, 2));
    
    // Get recent RFQ data
    const dataResult = await pool.query(`
      SELECT * FROM rfq_requests 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📊 Recent RFQ requests:');
    console.log(JSON.stringify(dataResult.rows, null, 2));
    
    // Check if there are chat sessions for these RFQs
    console.log('\n🔗 Checking chat sessions...');
    const sessionResult = await pool.query(`
      SELECT cs.*, c.name as customer_name
      FROM chat_sessions cs
      LEFT JOIN customers c ON c.phone = cs.customer_phone
      ORDER BY cs.last_message_at DESC
      LIMIT 10
    `);
    
    console.log('Chat sessions:');
    console.log(JSON.stringify(sessionResult.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking RFQ table:', error);
  } finally {
    await pool.end();
  }
}

checkRFQTable();
