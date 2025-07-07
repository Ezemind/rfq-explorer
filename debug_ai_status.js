// Debug AI status mismatch
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

async function debugAIStatus() {
  try {
    console.log('🔍 Debugging AI Status Mismatch...\n');
    
    // Check Pieter Kemp's phone number status
    const pieterPhone = '27744203713';
    
    console.log(`📱 Checking status for ${pieterPhone}:`);
    console.log('=====================================');
    
    // 1. Check ai_controls table directly
    const directCheck = await db.query(`
      SELECT * FROM ai_controls WHERE phone_number = '${pieterPhone}'
    `);
    
    if (directCheck.rows.length > 0) {
      const record = directCheck.rows[0];
      console.log('📊 Direct Database Record:');
      console.log(`   Phone: ${record.phone_number}`);
      console.log(`   AI Enabled: ${record.ai_enabled}`);
      console.log(`   Disabled At: ${record.ai_disabled_at}`);
      console.log(`   Last Human Message: ${record.last_human_message_at}`);
      console.log(`   Auto Re-enable Hours: ${record.auto_reenable_hours}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Updated: ${record.updated_at}`);
    } else {
      console.log('❌ No record found in ai_controls table');
    }
    
    // 2. Test the can_ai_respond function
    const canRespond = await db.query(`SELECT can_ai_respond('${pieterPhone}') as result`);
    console.log(`\n🤖 can_ai_respond('${pieterPhone}'): ${canRespond.rows[0].result}`);
    
    // 3. Check recent chat messages for this customer
    const recentMessages = await db.query(`
      SELECT id, message_text, sender_type, created_at, staff_user_id
      FROM chat_messages 
      WHERE customer_phone = '${pieterPhone}'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`\n📝 Recent Messages for ${pieterPhone}:`);
    recentMessages.rows.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.sender_type}: "${msg.message_text.substring(0, 50)}..." (${msg.created_at})`);
    });
    
    // 4. Test with other customers to see if it's a global issue
    console.log('\n🌐 Testing Other Customers:');
    const otherCustomers = await db.query(`
      SELECT DISTINCT customer_phone FROM chat_messages 
      WHERE customer_phone != '${pieterPhone}'
      LIMIT 3
    `);
    
    for (const customer of otherCustomers.rows) {
      const status = await db.query(`SELECT can_ai_respond('${customer.customer_phone}') as result`);
      console.log(`   📱 ${customer.customer_phone}: AI = ${status.rows[0].result ? 'ENABLED' : 'DISABLED'}`);
    }
    
    // 5. Check if the database trigger is working
    console.log('\n🔧 Checking Database Trigger:');
    const triggerCheck = await db.query(`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers 
      WHERE trigger_name = 'auto_disable_ai_trigger'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ auto_disable_ai_trigger exists');
    } else {
      console.log('❌ auto_disable_ai_trigger NOT FOUND');
    }
    
    // 6. Force update Pieter's status to test
    console.log('\n🔄 Testing Manual Toggle:');
    
    // Disable AI
    await db.query(`SELECT toggle_ai_status('${pieterPhone}', false)`);
    const afterDisable = await db.query(`SELECT can_ai_respond('${pieterPhone}') as result`);
    console.log(`   After disable: ${afterDisable.rows[0].result}`);
    
    // Enable AI  
    await db.query(`SELECT toggle_ai_status('${pieterPhone}', true)`);
    const afterEnable = await db.query(`SELECT can_ai_respond('${pieterPhone}') as result`);
    console.log(`   After enable: ${afterEnable.rows[0].result}`);
    
    // 7. Check the exact state after our test
    const finalCheck = await db.query(`
      SELECT * FROM ai_controls WHERE phone_number = '${pieterPhone}'
    `);
    
    console.log('\n📊 Final State After Test:');
    if (finalCheck.rows.length > 0) {
      const record = finalCheck.rows[0];
      console.log(`   AI Enabled: ${record.ai_enabled}`);
      console.log(`   Can AI Respond: ${afterEnable.rows[0].result}`);
      console.log(`   Last Updated: ${record.updated_at}`);
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('===================');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await db.end();
  }
}

debugAIStatus();
