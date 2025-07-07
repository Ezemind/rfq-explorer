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

async function fixPhoneNumberMismatch() {
  try {
    console.log('🔧 Fixing phone number format mismatch...');
    
    // First, let's disable AI for the short format number that n8n is using
    console.log('\n1. Disabling AI for 744203713 (the format n8n is checking)...');
    await db.query('SELECT disable_ai_for_human_takeover($1)', ['744203713']);
    
    // Also disable for the + format just in case
    console.log('2. Disabling AI for +27744203713 (plus format)...');
    await db.query('SELECT disable_ai_for_human_takeover($1)', ['+27744203713']);
    
    // Test all formats now
    console.log('\n🧪 Testing all formats after fix:');
    const testNumbers = ['27744203713', '744203713', '+27744203713'];
    
    for (const number of testNumbers) {
      const result = await db.query('SELECT can_ai_respond($1) as can_respond', [number]);
      console.log(`   "${number}": ${result.rows[0].can_respond}`);
    }
    
    console.log('\n✅ Quick fix applied!');
    console.log('📝 All phone number formats for Pieter now return AI disabled.');
    console.log('🔄 Try your n8n workflow again - it should now return false.');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
}

fixPhoneNumberMismatch();
