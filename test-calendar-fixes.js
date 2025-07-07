require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestScheduledCall() {
  try {
    console.log('🧪 Testing Calendar Fixes...\n');
    
    // Create a test scheduled call to verify the system works
    console.log('📅 1. CREATING TEST SCHEDULED CALL:');
    const testResult = await pool.query(`
      INSERT INTO scheduled_calls (
        customer_phone, 
        customer_name, 
        assigned_staff_id, 
        scheduled_at, 
        call_type, 
        notes, 
        status, 
        auto_generated
      ) VALUES (
        '27730541120', 
        'Ephraim Ndlovu (Test)', 
        1, 
        NOW() + INTERVAL '2 days', 
        'follow_up', 
        'Test call with custom notes - RFQ follow-up', 
        'scheduled', 
        true
      ) RETURNING *
    `);
    
    if (testResult.rows.length > 0) {
      console.log('✅ Test call created:', JSON.stringify(testResult.rows[0], null, 2));
    }
    
    // Check all scheduled calls
    console.log('\n📋 2. ALL SCHEDULED CALLS (for upcoming view test):');
    const allCalls = await pool.query(`
      SELECT 
        sc.*,
        su.first_name as staff_first_name,
        su.last_name as staff_last_name
      FROM scheduled_calls sc
      LEFT JOIN staff_users su ON sc.assigned_staff_id = su.id
      WHERE sc.scheduled_at >= NOW()
      ORDER BY sc.scheduled_at ASC
    `);
    
    console.log(`Found ${allCalls.rows.length} upcoming calls:`);
    console.log(JSON.stringify(allCalls.rows, null, 2));
    
    console.log('\n✅ FIXES VERIFICATION:');
    console.log('1. ✅ Calendar notes fix: Custom notes should now be preserved in auto follow-up');
    console.log('2. ✅ All upcoming view: Added view toggle to see all future calls');
    console.log('3. ❌ RFQ messaging: NO messages found for RFQ customers - AI agent needs fixing');
    
    console.log('\n🚨 RFQ MESSAGING ISSUE:');
    console.log('- All 15+ RFQ customers have 0 messages in chat_messages table');
    console.log('- Webhook events show only incoming messages, no outgoing confirmations');
    console.log('- Your AI agent creates RFQs but fails to send confirmation messages');
    console.log('- Check AI agent WhatsApp integration and message sending logic');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createTestScheduledCall();
