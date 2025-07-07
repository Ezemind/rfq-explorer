const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function verifyTabbyFix() {
  try {
    console.log('🔍 Verifying Tabby RFQ fix...');
    
    const customerPhone = '27823357013';
    
    // Check messages
    const messages = await pool.query(`
      SELECT COUNT(*) as count FROM chat_messages 
      WHERE customer_phone = $1
    `, [customerPhone]);
    
    // Check sessions
    const sessions = await pool.query(`
      SELECT COUNT(*) as count FROM chat_sessions 
      WHERE customer_phone = $1
    `, [customerPhone]);
    
    console.log('✅ Verification Results:');
    console.log('   Messages for Tabby:', messages.rows[0].count);
    console.log('   Sessions for Tabby:', sessions.rows[0].count);
    
    if (messages.rows[0].count > 0 && sessions.rows[0].count > 0) {
      console.log('🎉 SUCCESS: Tabby RFQ is now fixed and should appear in app!');
    } else {
      console.log('❌ Issue: Still missing messages or sessions');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

verifyTabbyFix();
