require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

async function analyzeDatabase() {
  try {
    console.log('🔍 Analyzing database structure and the foreign key issue...\n');
    
    // Check customers table structure
    const customersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    console.log('👥 CUSTOMERS table structure:');
    customersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Check chat_sessions table structure
    const chatSessionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      ORDER BY ordinal_position
    `);
    console.log('\n💬 CHAT_SESSIONS table structure:');
    chatSessionsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Check rfq_requests table structure
    const rfqColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'rfq_requests' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 RFQ_REQUESTS table structure:');
    rfqColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Check ALL foreign key constraints
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);
    console.log('\n🔗 ALL Foreign key constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`  - ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
    // Check if customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE phone = $1', ['27827789522']);
    console.log(`\n🔍 Customer with phone 27827789522 exists: ${customerCheck.rows.length > 0 ? 'YES' : 'NO'}`);
    if (customerCheck.rows.length > 0) {
      console.log('Customer data:', JSON.stringify(customerCheck.rows[0], null, 2));
    }
    
    // Check existing customers
    const allCustomers = await pool.query('SELECT phone, name FROM customers ORDER BY created_at DESC LIMIT 10');
    console.log('\n👥 Recent customers:');
    allCustomers.rows.forEach(customer => {
      console.log(`  - ${customer.phone} (${customer.name || 'No name'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

analyzeDatabase();
