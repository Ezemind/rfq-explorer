const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkNewRFQData() {
  try {
    console.log('🔍 Checking latest RFQ and message data...');
    
    // Check recent RFQ requests
    const rfqs = await pool.query('SELECT * FROM rfq_requests ORDER BY created_at DESC LIMIT 3');
    console.log('\n📋 Recent RFQ requests:');
    rfqs.rows.forEach((rfq, index) => {
      console.log(`${index + 1}. Order #${rfq.order_number} (${rfq.customer_name}): R${rfq.total_amount}`);
      console.log(`   Customer: ${rfq.customer_phone}, Status: ${rfq.status}`);
      console.log(`   Created: ${rfq.created_at}`);
      console.log('   ---');
    });
    
    // Check for Tabby's data specifically
    const tabbyData = await pool.query(`
      SELECT * FROM customers 
      WHERE name ILIKE '%Tabby%' OR phone LIKE '%27%'
      ORDER BY created_at DESC LIMIT 5
    `);
    console.log('\n👤 Tabby/Recent customer records:', tabbyData.rows.length);
    tabbyData.rows.forEach(customer => {
      console.log(`- ${customer.name} (${customer.phone})`);
      console.log(`  Email: ${customer.email}, Company: ${customer.company}`);
      console.log(`  Created: ${customer.created_at}`);
    });
    
    // Check messages for the latest RFQ customer
    if (rfqs.rows.length > 0) {
      const latestRFQ = rfqs.rows[0];
      console.log(`\n💬 Checking messages for ${latestRFQ.customer_name} (${latestRFQ.customer_phone})...`);
      
      const messages = await pool.query(`
        SELECT * FROM chat_messages 
        WHERE customer_phone = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [latestRFQ.customer_phone]);
      
      console.log(`Messages found: ${messages.rows.length}`);
      messages.rows.forEach((msg, index) => {
        const preview = msg.message_text ? msg.message_text.substring(0, 60) + '...' : '[No text]';
        console.log(`${index + 1}. ${msg.message_type} from ${msg.sender_type}: ${preview}`);
        console.log(`   Created: ${msg.created_at}`);
      });
      
      // Check chat sessions
      const sessions = await pool.query(`
        SELECT * FROM chat_sessions 
        WHERE customer_phone = $1
      `, [latestRFQ.customer_phone]);
      
      console.log(`\n🔗 Chat sessions: ${sessions.rows.length}`);
      sessions.rows.forEach(session => {
        console.log(`- Session ID: ${session.id}, Status: ${session.status}`);
        console.log(`  Last message: ${session.last_message_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkNewRFQData();
