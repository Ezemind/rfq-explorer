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

async function createMissingChatSessions() {
  try {
    console.log('🔧 Creating missing chat sessions for RFQ customers...\n');
    
    // Find RFQs without corresponding chat sessions
    const orphanRFQs = await db.query(`
      SELECT DISTINCT r.customer_phone, c.name, MIN(r.created_at) as first_rfq
      FROM rfq_requests r
      LEFT JOIN customers c ON r.customer_phone = c.phone
      WHERE NOT EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.customer_phone = r.customer_phone
      )
      GROUP BY r.customer_phone, c.name
      ORDER BY first_rfq DESC
    `);
    
    console.log(`Found ${orphanRFQs.rows.length} customers with RFQs but no chat sessions:`);
    
    let createdCount = 0;
    
    for (const customer of orphanRFQs.rows) {
      try {
        console.log(`Creating session for ${customer.name || 'Unknown'} (${customer.customer_phone})`);
        
        // Create chat session
        const sessionResult = await db.query(`
          INSERT INTO chat_sessions (customer_phone, status, created_at, updated_at, last_message_at)
          VALUES ($1, 'active', $2, $2, $2)
          RETURNING id
        `, [customer.customer_phone, customer.first_rfq]);
        
        const sessionId = sessionResult.rows[0].id;
        
        // Create an initial system message indicating the RFQ
        await db.query(`
          INSERT INTO chat_messages (
            session_id, customer_phone, message_text, message_type, 
            sender_type, created_at, is_ai_response
          ) VALUES ($1, $2, $3, 'text', 'system', $4, false)
        `, [
          sessionId,
          customer.customer_phone,
          `📋 Customer submitted an RFQ request. Ready to assist with quote processing.`,
          customer.first_rfq
        ]);
        
        createdCount++;
        console.log(`  ✅ Created session ${sessionId} with initial message`);
        
      } catch (error) {
        console.log(`  ❌ Error creating session for ${customer.customer_phone}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} chat sessions!`);
    
    // Now check what the active chats look like
    console.log('\n📱 Checking active chat sessions...');
    const activeSessions = await db.query(`
      SELECT cs.*, c.name as customer_name, 
             COUNT(cm.id) as message_count,
             MAX(cm.created_at) as last_message_time
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_phone = c.phone
      LEFT JOIN chat_messages cm ON cs.customer_phone = cm.customer_phone
      WHERE cs.status != 'closed' OR cs.status IS NULL
      GROUP BY cs.id, c.name
      ORDER BY cs.last_message_at DESC
      LIMIT 10
    `);
    
    console.log(`Active chat sessions: ${activeSessions.rows.length}`);
    activeSessions.rows.forEach((session, index) => {
      console.log(`${index + 1}. ${session.customer_name || 'Unknown'} (${session.customer_phone})`);
      console.log(`   Messages: ${session.message_count}, Last: ${session.last_message_time || 'Never'}`);
    });
    
    console.log('\n✅ Chat sessions creation completed!');
    console.log('💡 The app should now show these new chat sessions in the Active Chats list.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

createMissingChatSessions();
