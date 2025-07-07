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

async function testBothFunctions() {
  try {
    console.log('🔍 Testing both AI functions for Pieter...');
    
    const phone = '27744203713';
    
    // Test get_or_create_ai_control (used by getAIStatus)
    const getStatus = await db.query('SELECT * FROM get_or_create_ai_control($1)', [phone]);
    console.log('📊 getAIStatus result (get_or_create_ai_control):');
    console.log('   ai_enabled:', getStatus.rows[0].ai_enabled);
    console.log('   ai_disabled_at:', getStatus.rows[0].ai_disabled_at);
    console.log('   last_human_message_at:', getStatus.rows[0].last_human_message_at);
    
    // Test can_ai_respond (used by canAIRespond)  
    const canRespond = await db.query('SELECT can_ai_respond($1) as can_respond', [phone]);
    console.log('\n🤖 canAIRespond result (can_ai_respond):');
    console.log('   can_respond:', canRespond.rows[0].can_respond);
    
    console.log('\n💡 ANALYSIS:');
    console.log(`   Frontend Toggle shows: ai_enabled = ${getStatus.rows[0].ai_enabled}`);
    console.log(`   n8n workflow gets: can_respond = ${canRespond.rows[0].can_respond}`);
    console.log(`   Status Indicator uses: can_respond = ${canRespond.rows[0].can_respond}`);
    
    if (getStatus.rows[0].ai_enabled !== canRespond.rows[0].can_respond) {
      console.log('\n❌ MISMATCH FOUND!');
      console.log('   The ai_enabled field and can_ai_respond function return different values!');
      console.log('   This explains why the toggle and n8n show different states.');
    } else {
      console.log('\n✅ Both functions return the same value - no mismatch here.');
    }
    
    await db.end();
  } catch (error) {
    console.error('Error:', error.message);
    await db.end();
  }
}

testBothFunctions();
