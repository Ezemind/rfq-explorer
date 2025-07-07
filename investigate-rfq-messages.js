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

async function investigateRFQMessages() {
  try {
    console.log('🔍 Investigating RFQ Customer Messages...\n');
    
    // Get RFQ customers and check for messages
    console.log('📋 1. RFQ CUSTOMERS vs MESSAGES:');
    const result = await pool.query(`
      SELECT 
        r.customer_name,
        r.customer_phone,
        r.created_at as rfq_created,
        r.order_number,
        COUNT(cm.id) as message_count,
        MIN(cm.created_at) as first_message,
        MAX(cm.created_at) as last_message,
        ARRAY_AGG(DISTINCT cm.message_type) as message_types,
        ARRAY_AGG(DISTINCT cm.sender_type) as sender_types
      FROM rfq_requests r
      LEFT JOIN chat_messages cm ON cm.customer_phone = r.customer_phone
      WHERE r.status = 'processing'
      GROUP BY r.customer_name, r.customer_phone, r.created_at, r.order_number
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check for any automated/system messages
    console.log('\n📤 2. CHECKING FOR AUTOMATED MESSAGES:');
    const autoMessages = await pool.query(`
      SELECT 
        customer_phone,
        message_text,
        message_type,
        sender_type,
        created_at
      FROM chat_messages 
      WHERE sender_type = 'system' OR sender_type = 'bot' OR sender_type = 'automated'
         OR message_text ILIKE '%rfq%' OR message_text ILIKE '%request%' OR message_text ILIKE '%quote%'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(JSON.stringify(autoMessages.rows, null, 2));
    
    // Check message patterns around RFQ creation times
    console.log('\n⏰ 3. MESSAGES AROUND RFQ CREATION TIMES:');
    const timeRangeMessages = await pool.query(`
      SELECT 
        r.customer_name,
        r.customer_phone,
        r.created_at as rfq_time,
        cm.created_at as message_time,
        cm.message_text,
        cm.sender_type,
        EXTRACT(EPOCH FROM (cm.created_at - r.created_at))/60 as minutes_diff
      FROM rfq_requests r
      LEFT JOIN chat_messages cm ON cm.customer_phone = r.customer_phone 
        AND cm.created_at BETWEEN (r.created_at - INTERVAL '30 minutes') 
        AND (r.created_at + INTERVAL '30 minutes')
      WHERE r.status = 'processing'
      ORDER BY r.created_at DESC, cm.created_at
      LIMIT 20
    `);
    
    console.log(JSON.stringify(timeRangeMessages.rows, null, 2));
    
    // Check whatsapp_webhook_events for outgoing messages
    console.log('\n📲 4. CHECKING WHATSAPP WEBHOOK EVENTS:');
    const webhookEvents = await pool.query(`
      SELECT 
        event_type,
        from_number,
        to_number,
        message_text,
        created_at
      FROM whatsapp_webhook_events 
      WHERE event_type LIKE '%outgoing%' OR event_type = 'message_sent'
      ORDER BY created_at DESC
      LIMIT 15
    `);
    
    console.log(JSON.stringify(webhookEvents.rows, null, 2));
    
    console.log('\n✅ SUMMARY:');
    console.log('- Check if RFQ customers have corresponding messages');
    console.log('- Look for automated/system message patterns');  
    console.log('- Verify webhook events for outgoing messages');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

investigateRFQMessages();
