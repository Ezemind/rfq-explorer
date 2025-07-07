// Fix AI Toggle functions with proper column qualifiers
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

const db = new Pool(dbConfig);

async function fixAIFunctions() {
  try {
    console.log('🔧 Fixing AI functions with proper column qualifiers...');
    
    // Fix the get_or_create function with qualified column names
    await db.query(`
      CREATE OR REPLACE FUNCTION get_or_create_ai_control(p_phone_number VARCHAR(20))
      RETURNS TABLE(phone_number VARCHAR(20), ai_enabled BOOLEAN, ai_disabled_at TIMESTAMP, last_human_message_at TIMESTAMP, auto_reenable_hours INTEGER) AS $$
      BEGIN
          INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
          VALUES (p_phone_number, TRUE, 3)
          ON CONFLICT (ai_controls.phone_number) DO NOTHING;
          
          RETURN QUERY
          SELECT ac.phone_number, ac.ai_enabled, ac.ai_disabled_at, ac.last_human_message_at, ac.auto_reenable_hours
          FROM ai_controls ac
          WHERE ac.phone_number = p_phone_number;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Fixed get_or_create_ai_control function');
    
    // Fix the can_ai_respond function
    await db.query(`
      CREATE OR REPLACE FUNCTION can_ai_respond(p_phone_number VARCHAR(20))
      RETURNS BOOLEAN AS $$
      DECLARE
          ai_status BOOLEAN;
          disabled_at TIMESTAMP;
          last_human_at TIMESTAMP;
          reenable_hours INTEGER;
          hours_since_human NUMERIC;
      BEGIN
          SELECT result.ai_enabled, result.ai_disabled_at, result.last_human_message_at, result.auto_reenable_hours
          INTO ai_status, disabled_at, last_human_at, reenable_hours
          FROM get_or_create_ai_control(p_phone_number) AS result;
          
          IF ai_status = TRUE THEN
              RETURN TRUE;
          END IF;
          
          IF last_human_at IS NULL THEN
              RETURN FALSE;
          END IF;
          
          hours_since_human := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_at)) / 3600;
          
          IF hours_since_human >= reenable_hours THEN
              UPDATE ai_controls 
              SET ai_enabled = TRUE, 
                  ai_disabled_at = NULL,
                  updated_at = CURRENT_TIMESTAMP
              WHERE ai_controls.phone_number = p_phone_number;
              
              RETURN TRUE;
          END IF;
          
          RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Fixed can_ai_respond function');
    
    // Fix the toggle function
    await db.query(`
      CREATE OR REPLACE FUNCTION toggle_ai_status(p_phone_number VARCHAR(20), p_enabled BOOLEAN)
      RETURNS BOOLEAN AS $$
      BEGIN
          PERFORM get_or_create_ai_control(p_phone_number);
          
          UPDATE ai_controls 
          SET ai_enabled = p_enabled,
              ai_disabled_at = CASE WHEN p_enabled = FALSE THEN CURRENT_TIMESTAMP ELSE NULL END,
              updated_at = CURRENT_TIMESTAMP
          WHERE ai_controls.phone_number = p_phone_number;
          
          RETURN p_enabled;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Fixed toggle_ai_status function');
    
    // Fix the disable function
    await db.query(`
      CREATE OR REPLACE FUNCTION disable_ai_for_human_takeover(p_phone_number VARCHAR(20))
      RETURNS BOOLEAN AS $$
      BEGIN
          PERFORM get_or_create_ai_control(p_phone_number);
          
          UPDATE ai_controls 
          SET ai_enabled = FALSE,
              ai_disabled_at = CURRENT_TIMESTAMP,
              last_human_message_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE ai_controls.phone_number = p_phone_number;
          
          RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Fixed disable_ai_for_human_takeover function');
    
    // Test the functions
    console.log('\n🧪 Testing fixed functions...');
    const testResult = await db.query("SELECT can_ai_respond('test123') as test_result");
    console.log(`✅ can_ai_respond test: ${testResult.rows[0].test_result}`);
    
    const toggleResult = await db.query("SELECT toggle_ai_status('test123', false) as toggle_result");
    console.log(`✅ toggle_ai_status test: ${toggleResult.rows[0].toggle_result}`);
    
    const statusResult = await db.query("SELECT * FROM get_or_create_ai_control('test123')");
    console.log(`✅ get_or_create_ai_control test:`, statusResult.rows[0]);
    
    // Test with a real phone number format
    const realTestResult = await db.query("SELECT can_ai_respond('27744203713') as real_test");
    console.log(`✅ Real phone number test: ${realTestResult.rows[0].real_test}`);
    
    console.log('\n🎉 AI Toggle functions fixed and tested successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

fixAIFunctions();
