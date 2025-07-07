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

async function checkCustomersTable() {
  try {
    // Check customers table structure
    const customersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    console.log('👥 customers table structure:', JSON.stringify(customersColumns.rows, null, 2));
    
    // Check foreign key constraints on chat_sessions
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
        AND tc.table_name = 'chat_sessions'
    `);
    console.log('🔗 chat_sessions Foreign key constraints:', JSON.stringify(constraints.rows, null, 2));
    
    // Sample data from customers
    const sampleCustomers = await pool.query('SELECT phone, name FROM customers LIMIT 5');
    console.log('👥 Sample customers (phone/name):', JSON.stringify(sampleCustomers.rows, null, 2));
    
    // Check if customer with phone 27827789522 exists
    const specificCustomer = await pool.query('SELECT * FROM customers WHERE phone = $1', ['27827789522']);
    console.log('🔍 Customer with phone 27827789522:', JSON.stringify(specificCustomer.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCustomersTable();
