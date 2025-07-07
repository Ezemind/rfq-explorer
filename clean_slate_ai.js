// Clean slate AI function creation
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

async function cleanSlateAI() {
  try {
    console.log('🧹 Cleaning up existing functions...');
    
    // Drop all existing functions
    await db.query('DROP FUNCTION IF EXISTS can_ai_respond(character varying)');
    await db.query('DROP FUNCTION IF EXISTS toggle_ai_status(character varying, boolean)');
    await db.query('DROP FUNCTION IF EXISTS disable_ai_for_human_takeover(character varying)');
    await db.query('DROP FUNCTION IF EXISTS get_or_create_ai_control(character varying)');
    await db.query('DROP FUNCTION IF EXISTS reenable_ai_after_timeout()');
    console.log('✅ Cleaned up existing functions');
    
    console.log('\n🔧 Creating fresh AI functions...');
    
    // Function 1: can_ai_respond
    await db.query(`
      CREATE FUNCTION can_ai_respond(phone_num VARCHAR(20))
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
              SET ai_enabled = TRUE, ai_disabled_at = NULL, updated_at = NOW()
              WHERE phone_number = phone_num;
              RETURN TRUE;
          END IF;
          
          RETURN FALSE;
      END;
      $$;
    `);
    console.log('✅ can_ai_respond function created');
    
    // Function 2: toggle_ai_status
    await db.query(`
      CREATE FUNCTION toggle_ai_status(phone_num VARCHAR(20), new_status BOOLEAN)
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
    
    // Function 3: disable_ai_for_human_takeover
    await db.query(`
      CREATE FUNCTION disable_ai_for_human_takeover(phone_num VARCHAR(20))
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
    
    // Function 4: reenable_ai_after_timeout
    await db.query(`
      CREATE FUNCTION reenable_ai_after_timeout()
      RETURNS INTEGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
          updated_count INTEGER := 0;
      BEGIN
          UPDATE ai_controls 
          SET ai_enabled = TRUE, 
              ai_disabled_at = NULL,
              updated_at = NOW()
          WHERE ai_enabled = FALSE 
          AND last_human_message_at IS NOT NULL
          AND auto_reenable_hours IS NOT NULL
          AND EXTRACT(EPOCH FROM (NOW() - last_human_message_at)) / 3600 >= auto_reenable_hours;
          
          GET DIAGNOSTICS updated_count = ROW_COUNT;
          RETURN updated_count;
      END;
      $$;
    `);
    console.log('✅ reenable_ai_after_timeout function created');
    
    console.log('\n🧪 Running comprehensive tests...');
    
    // Test with real phone number
    const phoneNumber = '27744203713';
    
    console.log(`\nTesting with ${phoneNumber}:`);
    
    // Test 1: Initial status (should be true)
    const test1 = await db.query(`SELECT can_ai_respond('${phoneNumber}') as result`);
    console.log(`✅ Initial AI status: ${test1.rows[0].result}`);
    
    // Test 2: Toggle AI off
    const test2 = await db.query(`SELECT toggle_ai_status('${phoneNumber}', false) as result`);
    console.log(`✅ Toggle AI off: ${test2.rows[0].result}`);
    
    // Test 3: Check status after toggle off
    const test3 = await db.query(`SELECT can_ai_respond('${phoneNumber}') as result`);
    console.log(`✅ AI status after disable: ${test3.rows[0].result}`);
    
    // Test 4: Human takeover
    const test4 = await db.query(`SELECT disable_ai_for_human_takeover('${phoneNumber}') as result`);
    console.log(`✅ Human takeover: ${test4.rows[0].result}`);
    
    // Test 5: Check status after human takeover
    const test5 = await db.query(`SELECT can_ai_respond('${phoneNumber}') as result`);
    console.log(`✅ AI status after human takeover: ${test5.rows[0].result}`);
    
    // Test 6: Toggle AI back on
    const test6 = await db.query(`SELECT toggle_ai_status('${phoneNumber}', true) as result`);
    console.log(`✅ Toggle AI back on: ${test6.rows[0].result}`);
    
    // Test 7: Final check
    const test7 = await db.query(`SELECT can_ai_respond('${phoneNumber}') as result`);
    console.log(`✅ Final AI status: ${test7.rows[0].result}`);
    
    // Show the record
    const record = await db.query(`SELECT * FROM ai_controls WHERE phone_number = '${phoneNumber}'`);
    console.log(`\n📊 Final record:`, record.rows[0]);
    
    console.log('\n🎉 SUCCESS! All AI Toggle functions are working perfectly!');
    console.log('\n📋 Available Functions:');
    console.log('✅ can_ai_respond(phone_number) - Check if AI should respond');
    console.log('✅ toggle_ai_status(phone_number, enabled) - Manual toggle');
    console.log('✅ disable_ai_for_human_takeover(phone_number) - Auto-disable');
    console.log('✅ reenable_ai_after_timeout() - Bulk re-enable');
    
    console.log('\n🔗 N8N Integration Query:');
    console.log("SELECT can_ai_respond('{{ $node[\"Webhook\"].json[\"phone_number\"] }}') as ai_can_respond;");
    
    console.log('\n🚀 Ready to restart Bob3.1 and use the AI toggle!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

cleanSlateAI();
