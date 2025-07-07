const { Pool } = require('pg');

const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: {
    rejectUnauthorized: false
  }
};

async function checkDatabase() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if staff_users table exists
    const tableCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%'
    `);
    console.log('📋 User-related tables:', tableCheck.rows);
    
    // Check staff_users table structure
    try {
      const staffUsersStructure = await db.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'staff_users'
      `);
      console.log('🏗️ staff_users table structure:', staffUsersStructure.rows);
      
      // Check for Pieter87 user
      const pieterUser = await db.query(`
        SELECT * FROM staff_users WHERE username = 'Pieter87'
      `);
      console.log('👤 Pieter87 user data:', pieterUser.rows);
      
    } catch (error) {
      console.log('❌ staff_users table not found, checking other user tables...');
    }
    
    // Check all tables for any containing user data
    const allTables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 All tables:', allTables.rows.map(r => r.table_name));
    
    // Try to find Pieter87 in any table
    for (const table of allTables.rows) {
      try {
        const userCheck = await db.query(`
          SELECT * FROM ${table.table_name} 
          WHERE username = 'Pieter87' OR name = 'Pieter87'
          LIMIT 1
        `);
        if (userCheck.rows.length > 0) {
          console.log(`👤 Found Pieter87 in table ${table.table_name}:`, userCheck.rows[0]);
        }
      } catch (e) {
        // Skip tables that don't have username/name columns
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await db.end();
  }
}

checkDatabase();
