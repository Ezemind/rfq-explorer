require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  }
});

async function investigateRFQ() {
  try {
    console.log('🔍 Investigating RFQ requests...');
    
    // Get RFQ table structure
    console.log('\n📋 RFQ requests table structure:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'rfq_requests'
      ORDER BY ordinal_position
    `);
    console.log(JSON.stringify(structureResult.rows, null, 2));
    
    // Get recent RFQ data
    console.log('\n📊 Recent RFQ requests:');
    const rfqResult = await pool.query(`
      SELECT * FROM rfq_requests 
      ORDER BY created_at DESC 
      LIMIT 15
    `);
    console.log(JSON.stringify(rfqResult.rows, null, 2));
    
    // Check chat sessions that might be related
    console.log('\n💬 Recent chat sessions:');
    const chatResult = await pool.query(`
      SELECT cs.*, c.name as customer_name
      FROM chat_sessions cs
      LEFT JOIN customers c ON c.phone = cs.customer_phone
      WHERE cs.status != 'closed'
      ORDER BY cs.last_message_at DESC NULLS LAST
      LIMIT 10
    `);
    console.log(JSON.stringify(chatResult.rows, null, 2));
    
    // Check if RFQs have corresponding chat sessions
    console.log('\n🔗 Checking RFQ to chat session relationships:');
    const relationResult = await pool.query(`
      SELECT 
        r.id as rfq_id,
        r.customer_name,
        r.customer_phone,
        r.status as rfq_status,
        r.created_at as rfq_created,
        cs.id as chat_session_id,
        cs.status as chat_status,
        cs.last_message_at
      FROM rfq_requests r
      LEFT JOIN chat_sessions cs ON cs.customer_phone = r.customer_phone
      ORDER BY r.created_at DESC
      LIMIT 15
    `);
    console.log(JSON.stringify(relationResult.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

investigateRFQ();
