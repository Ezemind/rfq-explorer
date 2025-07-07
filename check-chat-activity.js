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

async function checkRecentActivity() {
  try {
    console.log('🔍 Checking recent RFQ and chat activity...\n');
    
    // Check recent RFQ requests
    const recentRFQs = await db.query(`
      SELECT r.*, c.name as customer_name 
      FROM rfq_requests r
      LEFT JOIN customers c ON r.customer_phone = c.phone
      WHERE r.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    console.log(`📋 Recent RFQs (last 24h): ${recentRFQs.rows.length}`);
    if (recentRFQs.rows.length > 0) {
      recentRFQs.rows.forEach(rfq => {
        console.log(`  - ${rfq.customer_name || 'Unknown'} (${rfq.customer_phone}) at ${rfq.created_at}`);
      });
    } else {
      console.log('  No recent RFQs found');
    }
    
    console.log('');
    
    // Check recent chat sessions
    const recentChats = await db.query(`
      SELECT cs.*, c.name as customer_name
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_phone = c.phone
      WHERE cs.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY cs.created_at DESC
      LIMIT 10
    `);
    
    console.log(`💬 Recent Chat Sessions (last 24h): ${recentChats.rows.length}`);
    if (recentChats.rows.length > 0) {
      recentChats.rows.forEach(chat => {
        console.log(`  - ${chat.customer_name || 'Unknown'} (${chat.customer_phone}) at ${chat.created_at}`);
      });
    } else {
      console.log('  No recent chat sessions found');
    }
    
    console.log('');
    
    // Check if there are RFQs without corresponding chat sessions
    const orphanRFQs = await db.query(`
      SELECT r.customer_phone, r.created_at, c.name
      FROM rfq_requests r
      LEFT JOIN customers c ON r.customer_phone = c.phone
      WHERE r.created_at > NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.customer_phone = r.customer_phone
      )
    `);
    
    console.log(`❗ RFQs without chat sessions: ${orphanRFQs.rows.length}`);
    if (orphanRFQs.rows.length > 0) {
      orphanRFQs.rows.forEach(rfq => {
        console.log(`  - ${rfq.name || 'Unknown'} (${rfq.customer_phone}) at ${rfq.created_at}`);
      });
    } else {
      console.log('  All RFQs have corresponding chat sessions');
    }
    
    console.log('');
    
    // Check what the app considers "active" chats
    const activeChats = await db.query(`
      SELECT cs.*, c.name as customer_name, 
             COUNT(cm.id) as message_count,
             MAX(cm.timestamp) as last_message_time
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_phone = c.phone
      LEFT JOIN chat_messages cm ON cs.customer_phone = cm.customer_phone
      WHERE cs.is_active = true
      GROUP BY cs.id, c.name
      ORDER BY cs.last_activity DESC
      LIMIT 10
    `);
    
    console.log(`📱 Active Chat Sessions: ${activeChats.rows.length}`);
    activeChats.rows.forEach(chat => {
      console.log(`  - ${chat.customer_name || 'Unknown'} (${chat.customer_phone})`);
      console.log(`    Messages: ${chat.message_count}, Last: ${chat.last_message_time || 'Never'}`);
      console.log(`    Active: ${chat.is_active}, Created: ${chat.created_at}`);
    });
    
    console.log('');
    
    // Check for any chat sessions that should be active but aren't showing
    const shouldBeActive = await db.query(`
      SELECT cs.*, c.name as customer_name
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_phone = c.phone
      WHERE cs.created_at > NOW() - INTERVAL '7 days'
      AND cs.is_active = false
      ORDER BY cs.created_at DESC
    `);
    
    console.log(`🔄 Recently inactive chat sessions: ${shouldBeActive.rows.length}`);
    if (shouldBeActive.rows.length > 0) {
      shouldBeActive.rows.slice(0, 5).forEach(chat => {
        console.log(`  - ${chat.customer_name || 'Unknown'} (${chat.customer_phone}) - Created: ${chat.created_at}`);
      });
    }
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecentActivity();
