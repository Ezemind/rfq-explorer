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

async function checkFunctions() {
  try {
    console.log('🔍 Checking AI functions in database...');
    
    // List all custom functions
    const functions = await db.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'FUNCTION' 
      AND routine_schema = 'public'
      AND routine_name LIKE '%ai%'
    `);
    
    console.log('AI-related functions:');
    functions.rows.forEach(func => {
      console.log(`  - ${func.routine_name}`);
    });
    
    // Test the actual calls from the electron app
    console.log('\n🧪 Testing actual function calls...');
    
    const phone = '27744203713';
    
    // This is what the electron app calls for getAIStatus
    try {
      const getStatus = await db.query('SELECT * FROM get_or_create_ai_control($1)', [phone]);
      console.log('✅ get_or_create_ai_control works');
    } catch (e) {
      console.log('❌ get_or_create_ai_control failed:', e.message);
      
      // Try alternative
      const aiControlRecord = await db.query('SELECT * FROM ai_controls WHERE phone_number = $1', [phone]);
      if (aiControlRecord.rows.length > 0) {
        console.log('📊 Direct ai_controls query result:');
        console.log('   ai_enabled:', aiControlRecord.rows[0].ai_enabled);
      }
    }
    
    // This is what n8n calls
    const canRespond = await db.query('SELECT can_ai_respond($1) as can_respond', [phone]);
    console.log('✅ can_ai_respond result:', canRespond.rows[0].can_respond);
    
    await db.end();
  } catch (error) {
    console.error('Error:', error.message);
    await db.end();
  }
}

checkFunctions();
