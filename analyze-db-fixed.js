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

async function fixedAnalysis() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🔍 CORRECTED DATABASE ANALYSIS\n');
    
    // Check messages with media using correct column names
    console.log('🖼️ MESSAGES WITH MEDIA:');
    const mediaMessages = await db.query(`
      SELECT id, session_id, sender_type, message_type, media_url, message_text, created_at
      FROM chat_messages 
      WHERE media_url IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Found ${mediaMessages.rows.length} messages with media`);
    mediaMessages.rows.forEach((msg, i) => {
      console.log(`\n  Message ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Session: ${msg.session_id}`);
      console.log(`    Sender: ${msg.sender_type}`);
      console.log(`    Type: ${msg.message_type}`);
      console.log(`    Media URL: ${msg.media_url}`);
      console.log(`    Text: ${msg.message_text?.substring(0, 50)}...`);
    });
    
    // Check all messages for recent activity
    console.log('\n📨 RECENT MESSAGES:');
    const recentMessages = await db.query(`
      SELECT id, session_id, sender_type, message_type, message_text, created_at
      FROM chat_messages 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Found ${recentMessages.rows.length} recent messages`);
    recentMessages.rows.forEach((msg, i) => {
      console.log(`\n  Message ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Session: ${msg.session_id}`);
      console.log(`    Sender: ${msg.sender_type}`);
      console.log(`    Type: ${msg.message_type}`);
      console.log(`    Text: ${msg.message_text?.substring(0, 100)}...`);
      console.log(`    Created: ${msg.created_at}`);
    });
    
    // Check sessions with messages
    console.log('\n🔗 SESSIONS WITH MESSAGE COUNTS:');
    const sessionStats = await db.query(`
      SELECT 
        cs.id,
        cs.customer_phone,
        cs.status,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_time
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cm.session_id = cs.id
      GROUP BY cs.id, cs.customer_phone, cs.status
      ORDER BY last_message_time DESC NULLS LAST
    `);
    console.log(`Found ${sessionStats.rows.length} sessions`);
    sessionStats.rows.forEach((session, i) => {
      console.log(`\n  Session ${i + 1}:`);
      console.log(`    ID: ${session.id}`);
      console.log(`    Phone: ${session.customer_phone}`);
      console.log(`    Status: ${session.status}`);
      console.log(`    Messages: ${session.message_count}`);
      console.log(`    Last Message: ${session.last_message_time}`);
    });
    
    // Check customers and their phone numbers
    console.log('\n👥 CUSTOMERS WITH SESSIONS:');
    const customersWithSessions = await db.query(`
      SELECT 
        c.phone,
        c.name,
        c.email,
        c.company,
        COUNT(cs.id) as session_count
      FROM customers c
      LEFT JOIN chat_sessions cs ON cs.customer_phone = c.phone
      GROUP BY c.phone, c.name, c.email, c.company
      ORDER BY session_count DESC
    `);
    console.log(`Found ${customersWithSessions.rows.length} customers`);
    customersWithSessions.rows.forEach((customer, i) => {
      console.log(`\n  Customer ${i + 1}:`);
      console.log(`    Phone: ${customer.phone}`);
      console.log(`    Name: ${customer.name}`);
      console.log(`    Email: ${customer.email}`);
      console.log(`    Company: ${customer.company}`);
      console.log(`    Sessions: ${customer.session_count}`);
    });
    
    // Check webhook events
    console.log('\n📡 RECENT WEBHOOK EVENTS:');
    const webhookEvents = await db.query(`
      SELECT id, event_type, phone_number, media_url, created_at
      FROM whatsapp_webhook_events 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Found ${webhookEvents.rows.length} webhook events`);
    webhookEvents.rows.forEach((event, i) => {
      console.log(`\n  Event ${i + 1}:`);
      console.log(`    ID: ${event.id}`);
      console.log(`    Type: ${event.event_type}`);
      console.log(`    Phone: ${event.phone_number}`);
      console.log(`    Media URL: ${event.media_url}`);
      console.log(`    Created: ${event.created_at}`);
    });
    
    // Check the mapping issue
    console.log('\n🔍 CHAT QUERY ISSUE ANALYSIS:');
    const currentQuery = await db.query(`
      SELECT DISTINCT 
        cs.id,
        cs.customer_phone,
        cs.status as session_status,
        cs.last_message_at,
        c.name as customer_name,
        cm.message_text as last_message,
        cm.message_type as last_message_type
      FROM chat_sessions cs
      LEFT JOIN customers c ON c.phone = cs.customer_phone
      LEFT JOIN LATERAL (
        SELECT message_text, message_type 
        FROM chat_messages 
        WHERE session_id = cs.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) cm ON true
      WHERE cs.status != 'closed' OR cs.status IS NULL
      ORDER BY cs.last_message_at DESC NULLS LAST
      LIMIT 5
    `);
    console.log(`Query returns ${currentQuery.rows.length} sessions for UI`);
    currentQuery.rows.forEach((session, i) => {
      console.log(`\n  UI Session ${i + 1}:`);
      console.log(`    ID: ${session.id}`);
      console.log(`    Phone: ${session.customer_phone}`);
      console.log(`    Customer: ${session.customer_name}`);
      console.log(`    Status: ${session.session_status}`);
      console.log(`    Last Message: ${session.last_message?.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await db.end();
  }
}

fixedAnalysis();
