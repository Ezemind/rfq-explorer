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

async function fixPieterAI() {
  try {
    console.log('🔧 Checking Pieter specific issue...');
    
    // Check if Pieter has any record in ai_controls
    const pieterCheck = await db.query('SELECT * FROM ai_controls WHERE phone_number = $1', ['27744203713']);
    console.log('Pieter in ai_controls:', pieterCheck.rows.length > 0 ? 'YES' : 'NO');
    
    if (pieterCheck.rows.length > 0) {
      console.log('Pieter record:', pieterCheck.rows[0]);
    }
    
    // Check recent messages for Pieter
    const recentMessages = await db.query(
      'SELECT sender_type, message_text, created_at FROM chat_messages WHERE customer_phone = $1 ORDER BY created_at DESC LIMIT 5', 
      ['27744203713']
    );
    console.log('Recent messages:');
    recentMessages.rows.forEach(msg => {
      console.log(`  ${msg.sender_type}: ${msg.message_text.substring(0, 30)}... (${msg.created_at})`);
    });
    
    // Create the record manually and disable AI for Pieter since he has staff messages
    console.log('🚫 Disabling AI for Pieter manually...');
    await db.query('SELECT disable_ai_for_human_takeover($1)', ['27744203713']);
    
    // Check result
    const finalCheck = await db.query('SELECT can_ai_respond($1) as can_respond', ['27744203713']);
    console.log('Final result - Can AI respond:', finalCheck.rows[0].can_respond);
    
    await db.end();
  } catch (error) {
    console.error('Error:', error.message);
    await db.end();
  }
}

fixPieterAI();
