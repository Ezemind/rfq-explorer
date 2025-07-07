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

async function checkPhoneFormats() {
  try {
    console.log('🔍 Checking phone number formats...');
    
    // Check what phone numbers exist in ai_controls
    const aiControls = await db.query('SELECT phone_number FROM ai_controls ORDER BY created_at DESC LIMIT 5');
    console.log('📊 Phone numbers in ai_controls:');
    aiControls.rows.forEach(row => console.log('   ', row.phone_number));
    
    // Check what phone numbers exist in chat_messages  
    const chatMessages = await db.query('SELECT DISTINCT customer_phone FROM chat_messages ORDER BY customer_phone LIMIT 10');
    console.log('📱 Phone numbers in chat_messages:');
    chatMessages.rows.forEach(row => console.log('   ', row.customer_phone));
    
    // Test the exact query from your n8n workflow
    console.log('🤖 Testing n8n query with Pieter phone...');
    const test1 = await db.query('SELECT can_ai_respond($1) as ai_can_respond', ['27744203713']);
    console.log('   Result with 27744203713:', test1.rows[0].ai_can_respond);
    
    // Test without country code
    const test2 = await db.query('SELECT can_ai_respond($1) as ai_can_respond', ['744203713']);
    console.log('   Result with 744203713:', test2.rows[0].ai_can_respond);
    
    await db.end();
  } catch (error) {
    console.error('Error:', error.message);
    await db.end();
  }
}

checkPhoneFormats();
