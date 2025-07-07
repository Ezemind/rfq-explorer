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

async function debugN8nIssue() {
  try {
    console.log('🔍 Debugging n8n vs frontend mismatch...');
    
    // Check what phone numbers exist in ai_controls
    const allAiControls = await db.query('SELECT phone_number, ai_enabled FROM ai_controls ORDER BY phone_number');
    console.log('\n📊 All phone numbers in ai_controls:');
    allAiControls.rows.forEach(row => {
      console.log(`   ${row.phone_number}: AI ${row.ai_enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Test different phone number formats that n8n might be sending
    const testNumbers = [
      '27744203713',   // Full format
      '744203713',     // Without country code  
      '+27744203713',  // With plus
      '27 74 420 3713' // With spaces
    ];
    
    console.log('\n🧪 Testing different phone number formats:');
    for (const number of testNumbers) {
      const result = await db.query('SELECT can_ai_respond($1) as can_respond', [number]);
      console.log(`   "${number}": ${result.rows[0].can_respond}`);
    }
    
    // Check what the WhatsApp metadata actually contains
    console.log('\n📱 Check your WhatsApp webhook payload for these fields:');
    console.log('   - $node["WhatsApp Trigger RFQ"].json["metadata"]["display_phone_number"]');
    console.log('   - $node["WhatsApp Trigger RFQ"].json["metadata"]["phone_number_id"]'); 
    console.log('   - $node["WhatsApp Trigger RFQ"].json["from"]');
    
    // Test what happens if we create a record for different formats
    console.log('\n🔧 Testing if n8n is using a different phone format...');
    
    // Check if there's a record for format without country code
    const withoutCountry = await db.query('SELECT * FROM ai_controls WHERE phone_number = $1', ['744203713']);
    if (withoutCountry.rows.length > 0) {
      console.log('❗ Found record for 744203713:', withoutCountry.rows[0]);
    }
    
    // Check with plus
    const withPlus = await db.query('SELECT * FROM ai_controls WHERE phone_number = $1', ['+27744203713']);
    if (withPlus.rows.length > 0) {
      console.log('❗ Found record for +27744203713:', withPlus.rows[0]);
    }
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
}

debugN8nIssue();
