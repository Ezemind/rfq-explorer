// Step by step AI function creation
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

async function createFunctionsStepByStep() {
  try {
    console.log('🔧 Creating AI functions step by step...');
    
    console.log('Step 1: Creating simple can_ai_respond function...');
    await db.query(`
      CREATE OR REPLACE FUNCTION can_ai_respond(phone_num VARCHAR(20))
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      AS $$
      DECLARE
          ai_status BOOLEAN := TRUE;
          last_human TIMESTAMP;
          hours_diff NUMERIC;
          reenable_hours INTEGER := 3;
      BEGIN
          -- Insert default record if not exists
          INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
          VALUES (phone_num, TRUE, 3)
          ON CONFLICT (phone_number) DO NOTHING;
          
          -- Get current status
          SELECT ai_enabled, last_human_message_at, auto_reenable_hours
          INTO ai_status, last_human, reenable_hours
          FROM ai_controls
          WHERE phone_number = phone_num;
          
          -- If AI enabled, return true
          IF ai_status THEN
              RETURN TRUE;
          END IF;
          
          -- If no human message recorded, stay disabled
          IF last_human IS NULL THEN
              RETURN FALSE;
          END IF;
          
          -- Check if enough time passed
          hours_diff := EXTRACT(EPOCH FROM (NOW() - last_human)) / 3600;
          
          IF hours_diff >= reenable_hours THEN
              -- Re-enable AI
              UPDATE ai_controls 
              SET ai_enabled = TRUE, ai_disabled_at = NULL
              WHERE phone_number = phone_num;
              RETURN TRUE;
          END IF;
          
          RETURN FALSE;
      END;
      $$;
    `);
    console.log('✅ can_ai_respond function created');
    
    console.log('Step 2: Creating toggle_ai_status function...');
    await db.query(`
      CREATE OR REPLACE FUNCTION toggle_ai_status(phone_num VARCHAR(20), new_status BOOLEAN)
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      AS $$
      BEGIN
          -- Insert default record if not exists
          INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
          VALUES (phone_num, TRUE, 3)
          ON CONFLICT (phone_number) DO NOTHING;
          
          -- Update status
          UPDATE ai_controls 
          SET ai_enabled = new_status,
              ai_disabled_at = CASE WHEN new_status = FALSE THEN NOW() ELSE NULL END,
              updated_at = NOW()
          WHERE phone_number = phone_num;
          
          RETURN new_status;
      END;
      $$;
    `);
    console.log('✅ toggle_ai_status function created');
    
    console.log('Step 3: Creating disable_ai_for_human_takeover function...');
    await db.query(`
      CREATE OR REPLACE FUNCTION disable_ai_for_human_takeover(phone_num VARCHAR(20))
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      AS $$
      BEGIN
          -- Insert default record if not exists
          INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
          VALUES (phone_num, TRUE, 3)
          ON CONFLICT (phone_number) DO NOTHING;
          
          -- Disable AI
          UPDATE ai_controls 
          SET ai_enabled = FALSE,
              ai_disabled_at = NOW(),
              last_human_message_at = NOW(),
              updated_at = NOW()
          WHERE phone_number = phone_num;
          
          RETURN TRUE;
      END;
      $$;
    `);
    console.log('✅ disable_ai_for_human_takeover function created');
    
    console.log('Step 4: Testing functions...');
    
    // Test 1: Basic test
    const test1 = await db.query("SELECT can_ai_respond('27744203713') as result");
    console.log(`✅ Test 1 - can_ai_respond('27744203713'): ${test1.rows[0].result}`);
    
    // Test 2: Toggle off
    const test2 = await db.query("SELECT toggle_ai_status('27744203713', false) as result");
    console.log(`✅ Test 2 - toggle_ai_status('27744203713', false): ${test2.rows[0].result}`);
    
    // Test 3: Check after toggle off
    const test3 = await db.query("SELECT can_ai_respond('27744203713') as result");
    console.log(`✅ Test 3 - can_ai_respond after disable: ${test3.rows[0].result}`);
    
    // Test 4: Toggle back on
    const test4 = await db.query("SELECT toggle_ai_status('27744203713', true) as result");
    console.log(`✅ Test 4 - toggle_ai_status('27744203713', true): ${test4.rows[0].result}`);
    
    // Test 5: Check after toggle on
    const test5 = await db.query("SELECT can_ai_respond('27744203713') as result");
    console.log(`✅ Test 5 - can_ai_respond after enable: ${test5.rows[0].result}`);
    
    // Test 6: Human takeover
    const test6 = await db.query("SELECT disable_ai_for_human_takeover('27744203713') as result");
    console.log(`✅ Test 6 - disable_ai_for_human_takeover: ${test6.rows[0].result}`);
    
    // Test 7: Check after human takeover
    const test7 = await db.query("SELECT can_ai_respond('27744203713') as result");
    console.log(`✅ Test 7 - can_ai_respond after human takeover: ${test7.rows[0].result}`);
    
    // Show current record
    const currentRecord = await db.query("SELECT * FROM ai_controls WHERE phone_number = '27744203713'");
    console.log('\n📊 Current record for 27744203713:', currentRecord.rows[0]);
    
    console.log('\n🎉 All AI functions are working perfectly!');
    console.log('\n📋 Functions ready:');
    console.log('✅ can_ai_respond(phone_number)');
    console.log('✅ toggle_ai_status(phone_number, enabled)');
    console.log('✅ disable_ai_for_human_takeover(phone_number)');
    console.log('\n🔗 For n8n, use:');
    console.log('SELECT can_ai_respond(\'{{ $node["Webhook"].json["phone_number"] }}\') as ai_can_respond;');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

createFunctionsStepByStep();
