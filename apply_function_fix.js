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

async function fixMissingFunction() {
  try {
    console.log('🔧 Creating missing get_or_create_ai_control function...');
    
    const createFunction = `
CREATE OR REPLACE FUNCTION get_or_create_ai_control(p_phone_number VARCHAR(20))
RETURNS TABLE(phone_number VARCHAR(20), ai_enabled BOOLEAN, ai_disabled_at TIMESTAMP, last_human_message_at TIMESTAMP, auto_reenable_hours INTEGER) AS $$
BEGIN
    -- Insert if not exists, return existing or new record
    INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
    VALUES (p_phone_number, TRUE, 3)
    ON CONFLICT (phone_number) DO NOTHING;
    
    RETURN QUERY
    SELECT ac.phone_number, ac.ai_enabled, ac.ai_disabled_at, ac.last_human_message_at, ac.auto_reenable_hours
    FROM ai_controls ac
    WHERE ac.phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;
    `;
    
    await db.query(createFunction);
    console.log('✅ Function created successfully!');
    
    // Test the function
    console.log('\n🧪 Testing the new function...');
    const test = await db.query('SELECT * FROM get_or_create_ai_control($1)', ['27744203713']);
    console.log('📊 Result for Pieter:');
    console.log('   phone_number:', test.rows[0].phone_number);
    console.log('   ai_enabled:', test.rows[0].ai_enabled);
    console.log('   ai_disabled_at:', test.rows[0].ai_disabled_at);
    console.log('   last_human_message_at:', test.rows[0].last_human_message_at);
    console.log('   auto_reenable_hours:', test.rows[0].auto_reenable_hours);
    
    console.log('\n✅ Fix completed! The frontend should now work properly.');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
}

fixMissingFunction();
