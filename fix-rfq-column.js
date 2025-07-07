const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function fixRfqColumn() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if the column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'rfq_request_id'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('🔧 Adding missing rfq_request_id column...');
      
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN rfq_request_id INTEGER DEFAULT NULL
      `);
      
      console.log('✅ Added rfq_request_id column to projects table');
    } else {
      console.log('✅ rfq_request_id column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixRfqColumn();
