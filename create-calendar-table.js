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

async function createScheduledCallsTable() {
  try {
    console.log('🏗️ Creating scheduled_calls table...');
    
    // Create the scheduled_calls table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_calls (
        id SERIAL PRIMARY KEY,
        customer_phone VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        assigned_staff_id INTEGER REFERENCES staff_users(id),
        scheduled_at TIMESTAMP NOT NULL,
        call_type VARCHAR(100) DEFAULT 'follow_up',
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        auto_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_calls_date 
      ON scheduled_calls(scheduled_at)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_calls_staff 
      ON scheduled_calls(assigned_staff_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_calls_phone 
      ON scheduled_calls(customer_phone)
    `);
    
    console.log('✅ scheduled_calls table created successfully!');
    
    // Check if table exists and show structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_calls'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createScheduledCallsTable();
