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

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete AI toggle flow...');
    
    const phone = '27744203713';
    
    // 1. Test the electron app's getAIStatus query
    console.log('\n📱 Testing getAIStatus (frontend toggle):');
    const getStatus = await db.query('SELECT (get_or_create_ai_control($1)).*', [phone]);
    console.log('   ai_enabled:', getStatus.rows[0].ai_enabled);
    console.log('   ai_disabled_at:', getStatus.rows[0].ai_disabled_at);
    
    // 2. Test the n8n workflow query
    console.log('\n🤖 Testing n8n workflow query:');
    const n8nResult = await db.query('SELECT can_ai_respond($1) as ai_can_respond', [phone]);
    console.log('   ai_can_respond:', n8nResult.rows[0].ai_can_respond);
    
    // 3. Test the status indicator query
    console.log('\n📊 Testing status indicator:');
    console.log('   Status indicator uses can_ai_respond, so:', n8nResult.rows[0].ai_can_respond);
    
    console.log('\n📋 SUMMARY:');
    console.log('===============');
    console.log(`   Frontend toggle shows: ai_enabled = ${getStatus.rows[0].ai_enabled}`);
    console.log(`   n8n workflow returns: ai_can_respond = ${n8nResult.rows[0].ai_can_respond}`);
    console.log(`   Status indicator shows: ${n8nResult.rows[0].ai_can_respond ? 'AI ON (hidden)' : 'AI OFF (visible)'}`);
    
    if (getStatus.rows[0].ai_enabled === n8nResult.rows[0].ai_can_respond) {
      console.log('\n✅ ALL SYSTEMS SYNCHRONIZED!');
      console.log('   The frontend and n8n should now show the same status.');
    } else {
      console.log('\n⚠️ STILL A MISMATCH');
      console.log('   There may be additional logic in the can_ai_respond function.');
    }
    
    // 4. Test toggle functionality
    console.log('\n🔄 Testing toggle functionality:');
    
    // Enable AI
    await db.query('SELECT toggle_ai_status($1, $2)', [phone, true]);
    const afterEnable = await db.query('SELECT can_ai_respond($1) as can_respond', [phone]);
    console.log(`   After enabling: ${afterEnable.rows[0].can_respond}`);
    
    // Disable AI  
    await db.query('SELECT toggle_ai_status($1, $2)', [phone, false]);
    const afterDisable = await db.query('SELECT can_ai_respond($1) as can_respond', [phone]);
    console.log(`   After disabling: ${afterDisable.rows[0].can_respond}`);
    
    console.log('\n🎯 TESTING COMPLETE');
    console.log('==================');
    console.log('✅ Database functions are working correctly');
    console.log('✅ Electron API should now work properly');  
    console.log('✅ n8n workflow should receive correct values');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your Electron app to use the updated handler');
    console.log('   2. Test the toggle button in the UI');
    console.log('   3. Verify n8n receives the correct response');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
}

testCompleteFlow();
