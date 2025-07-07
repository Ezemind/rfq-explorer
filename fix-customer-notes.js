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

async function checkAndFixCustomerNotes() {
  console.log('🔧 Checking customer_notes table...');
  
  try {
    // Check current structure
    const currentStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customer_notes' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current customer_notes structure:', JSON.stringify(currentStructure.rows, null, 2));
    
    // Check if staff_user_id column exists
    const hasStaffUserId = currentStructure.rows.some(col => col.column_name === 'staff_user_id');
    
    if (!hasStaffUserId) {
      console.log('➕ Adding staff_user_id column...');
      await pool.query(`
        ALTER TABLE customer_notes 
        ADD COLUMN staff_user_id INTEGER REFERENCES staff_users(id)
      `);
      console.log('✅ Added staff_user_id column');
      
      // Migrate existing data - set created_by as staff_user_id for compatibility
      await pool.query(`
        UPDATE customer_notes 
        SET staff_user_id = created_by 
        WHERE created_by IS NOT NULL
      `);
      console.log('✅ Migrated existing data');
    } else {
      console.log('✅ staff_user_id column already exists');
    }
    
    // Check if content column exists (for backward compatibility)
    const hasContent = currentStructure.rows.some(col => col.column_name === 'content');
    
    if (!hasContent && currentStructure.rows.some(col => col.column_name === 'note_text')) {
      console.log('➕ Adding content column as alias...');
      await pool.query(`
        ALTER TABLE customer_notes 
        ADD COLUMN content TEXT
      `);
      
      // Copy data from note_text to content
      await pool.query(`
        UPDATE customer_notes 
        SET content = note_text 
        WHERE note_text IS NOT NULL
      `);
      console.log('✅ Added content column for compatibility');
    }
    
    // Verify final structure
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customer_notes' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Final customer_notes structure:', JSON.stringify(finalStructure.rows, null, 2));
    
    // Test with sample data
    const sampleNotes = await pool.query('SELECT * FROM customer_notes LIMIT 2');
    console.log('📝 Sample notes data:', JSON.stringify(sampleNotes.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndFixCustomerNotes();