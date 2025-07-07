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

async function analyzeDatabase() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🔍 ANALYZING BOB EXPLORER DATABASE STRUCTURE\n');
    
    // 1. Check WhatsApp related tables
    console.log('📱 WHATSAPP RELATED TABLES:');
    const whatsappTables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%whatsapp%' OR table_name LIKE '%chat%' OR table_name LIKE '%message%')
      ORDER BY table_name
    `);
    console.log(whatsappTables.rows.map(r => `  - ${r.table_name}`).join('\n'));
    
    // 2. Analyze chat_sessions table
    console.log('\n📋 CHAT_SESSIONS TABLE STRUCTURE:');
    const chatSessionsStructure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions'
      ORDER BY ordinal_position
    `);
    console.log(chatSessionsStructure.rows.map(r => `  ${r.column_name}: ${r.data_type} (${r.is_nullable})`).join('\n'));
    
    // 3. Check actual chat sessions data
    console.log('\n💬 CHAT_SESSIONS SAMPLE DATA:');
    const chatSessions = await db.query(`
      SELECT * FROM chat_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`Found ${chatSessions.rows.length} chat sessions`);
    chatSessions.rows.forEach((session, i) => {
      console.log(`\n  Session ${i + 1}:`);
      console.log(`    ID: ${session.id}`);
      console.log(`    Customer Phone: ${session.customer_phone}`);
      console.log(`    Status: ${session.session_status}`);
      console.log(`    Created: ${session.created_at}`);
      console.log(`    Last Message: ${session.last_message_at}`);
    });
    
    // 4. Analyze chat_messages table
    console.log('\n📨 CHAT_MESSAGES TABLE STRUCTURE:');
    const chatMessagesStructure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages'
      ORDER BY ordinal_position
    `);
    console.log(chatMessagesStructure.rows.map(r => `  ${r.column_name}: ${r.data_type} (${r.is_nullable})`).join('\n'));
    
    // 5. Check messages with media
    console.log('\n🖼️ MESSAGES WITH MEDIA:');
    const mediaMessages = await db.query(`
      SELECT id, session_id, sender, message_type, media_url, content, timestamp
      FROM chat_messages 
      WHERE media_url IS NOT NULL 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    console.log(`Found ${mediaMessages.rows.length} messages with media`);
    mediaMessages.rows.forEach((msg, i) => {
      console.log(`\n  Message ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Session: ${msg.session_id}`);
      console.log(`    Type: ${msg.message_type}`);
      console.log(`    Media URL: ${msg.media_url}`);
      console.log(`    Content: ${msg.content?.substring(0, 50)}...`);
    });
    
    // 6. Check customers table
    console.log('\n👥 CUSTOMERS TABLE STRUCTURE:');
    const customersStructure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);
    console.log(customersStructure.rows.map(r => `  ${r.column_name}: ${r.data_type} (${r.is_nullable})`).join('\n'));
    
    // 7. Sample customers data
    console.log('\n👤 CUSTOMERS SAMPLE DATA:');
    const customers = await db.query(`
      SELECT phone, name, email, company, created_at
      FROM customers 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`Found ${customers.rows.length} customers`);
    customers.rows.forEach((customer, i) => {
      console.log(`\n  Customer ${i + 1}:`);
      console.log(`    Phone: ${customer.phone}`);
      console.log(`    Name: ${customer.name}`);
      console.log(`    Email: ${customer.email}`);
      console.log(`    Company: ${customer.company}`);
    });
    
    // 8. Check webhook tables
    console.log('\n🔗 WEBHOOK RELATED TABLES:');
    const webhookTables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%webhook%'
      ORDER BY table_name
    `);
    console.log(webhookTables.rows.map(r => `  - ${r.table_name}`).join('\n'));
    
    // 9. Check whatsapp_webhook_events
    if (webhookTables.rows.some(r => r.table_name === 'whatsapp_webhook_events')) {
      console.log('\n📡 WHATSAPP_WEBHOOK_EVENTS STRUCTURE:');
      const webhookStructure = await db.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'whatsapp_webhook_events'
        ORDER BY ordinal_position
      `);
      console.log(webhookStructure.rows.map(r => `  ${r.column_name}: ${r.data_type} (${r.is_nullable})`).join('\n'));
      
      // Sample webhook events
      console.log('\n📨 RECENT WEBHOOK EVENTS:');
      const webhookEvents = await db.query(`
        SELECT id, event_type, phone_number, media_url, created_at
        FROM whatsapp_webhook_events 
        ORDER BY created_at DESC 
        LIMIT 5
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
    }
    
    // 10. Check RFQ tables
    console.log('\n📋 RFQ RELATED DATA:');
    const rfqCount = await db.query('SELECT COUNT(*) FROM rfq_requests');
    const rfqProductsCount = await db.query('SELECT COUNT(*) FROM rfq_products');
    console.log(`  RFQ Requests: ${rfqCount.rows[0].count}`);
    console.log(`  RFQ Products: ${rfqProductsCount.rows[0].count}`);
    
    // 11. Check data relationships
    console.log('\n🔗 DATA RELATIONSHIPS:');
    const dataRelations = await db.query(`
      SELECT 
        cs.id as session_id,
        cs.customer_phone,
        c.name as customer_name,
        COUNT(cm.id) as message_count,
        COUNT(CASE WHEN cm.media_url IS NOT NULL THEN 1 END) as media_count
      FROM chat_sessions cs
      LEFT JOIN customers c ON c.phone = cs.customer_phone
      LEFT JOIN chat_messages cm ON cm.session_id = cs.id
      GROUP BY cs.id, cs.customer_phone, c.name
      ORDER BY message_count DESC
      LIMIT 10
    `);
    console.log(`Found ${dataRelations.rows.length} sessions with data`);
    dataRelations.rows.forEach((rel, i) => {
      console.log(`\n  Session ${i + 1}:`);
      console.log(`    Session ID: ${rel.session_id}`);
      console.log(`    Phone: ${rel.customer_phone}`);
      console.log(`    Customer: ${rel.customer_name || 'Unknown'}`);
      console.log(`    Messages: ${rel.message_count}`);
      console.log(`    Media: ${rel.media_count}`);
    });
    
  } catch (error) {
    console.error('❌ Database analysis error:', error);
  } finally {
    await db.end();
  }
}

analyzeDatabase();
