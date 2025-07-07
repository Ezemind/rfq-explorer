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

async function addStaffAssignmentColumn() {
  console.log('🔧 Adding staff assignment column to chat_sessions...');
  
  try {
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' AND column_name = 'assigned_staff_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Column assigned_staff_id already exists');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE chat_sessions 
      ADD COLUMN assigned_staff_id INTEGER REFERENCES staff_users(id)
    `);
    
    console.log('✅ Successfully added assigned_staff_id column');
    
    // Verify the addition
    const verification = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Updated chat_sessions structure:', JSON.stringify(verification.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addStaffAssignmentColumn();