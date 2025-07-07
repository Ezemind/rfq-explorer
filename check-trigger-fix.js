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

async function checkTriggerAndFix() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🎯 Checking the rfq_chat_session_trigger...\n');
    
    // Get trigger definition
    const triggerDef = await db.query(`
      SELECT 
        pg_get_triggerdef(oid) as trigger_definition
      FROM pg_trigger 
      WHERE tgname = 'rfq_chat_session_trigger'
    `);
    
    if (triggerDef.rows.length > 0) {
      console.log('🔍 Trigger definition:');
      console.log(triggerDef.rows[0].trigger_definition);
    }
    
    // Get the function that the trigger calls
    const functions = await db.query(`
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname LIKE '%rfq%'
        OR p.proname LIKE '%chat_session%'
    `);
    
    console.log('\n📋 Related functions:');
    functions.rows.forEach(func => {
      console.log(`\n🔧 Function: ${func.function_name}`);
      console.log(func.function_definition);
    });
    
    // Let's also manually create the missing customer to test
    console.log('\n🔧 Creating missing customer for testing...');
    const createCustomer = await db.query(`
      INSERT INTO customers (phone, name, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING id, phone, name
    `, ['27827789522', 'Test Customer']);
    
    console.log('✅ Customer created/updated:', createCustomer.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

checkTriggerAndFix();
