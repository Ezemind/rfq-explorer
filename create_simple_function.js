const { Pool } = require('pg');

const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
};

const db = new Pool(dbConfig);

async function createSimpleFunction() {
  try {
    console.log('🔧 Creating simple working function...');
    
    // Drop the existing broken function first
    await db.query('DROP FUNCTION IF EXISTS get_or_create_ai_control(VARCHAR)');
    
    // Create a simple version that returns the record type
    const createFunction = `
      CREATE OR REPLACE FUNCTION get_or_create_ai_control(p_phone_number VARCHAR(20))
      RETURNS ai_controls AS $$
      DECLARE
          result ai_controls;
      BEGIN
          -- Insert if not exists
          INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
          VALUES (p_phone_number, TRUE, 3)
          ON CONFLICT (phone_number) DO NOTHING;
          
          -- Get the record
          SELECT * INTO result FROM ai_controls WHERE phone_number = p_phone_number;
          
          RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await db.query(createFunction);
    console.log('✅ Function created successfully!');
    
    // Test it
    console.log('\n🧪 Testing function...');
    const test = await db.query('SELECT (get_or_create_ai_control($1)).*', ['27744203713']);
    console.log('📊 Result for Pieter:');
    console.log('   phone_number:', test.rows[0].phone_number);
    console.log('   ai_enabled:', test.rows[0].ai_enabled);
    console.log('   ai_disabled_at:', test.rows[0].ai_disabled_at);
    
    console.log('\n✅ Function is working! Frontend should now sync properly.');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
}

createSimpleFunction();
