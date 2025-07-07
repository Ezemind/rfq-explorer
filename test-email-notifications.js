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

async function testEmailNotifications() {
  try {
    console.log('🔔 Testing email notification system...');
    
    // Check the customer chat list with email counts
    const chatResult = await db.query(`
      SELECT DISTINCT 
        cs.id,
        cs.customer_phone,
        cs.status as session_status,
        cs.last_message_at,
        cs.assigned_staff_id,
        c.name as customer_name,
        c.company,
        c.id as customer_id,
        c.email as customer_email,
        COUNT(cm_all.id) as message_count,
        COUNT(rfq.id) as rfq_count,
        COUNT(em.id) FILTER (WHERE em.direction = 'inbound' AND NOT em.is_read) as unread_email_count
      FROM chat_sessions cs
      LEFT JOIN customers c ON c.phone = cs.customer_phone
      LEFT JOIN chat_messages cm_all ON cm_all.session_id = cs.id
      LEFT JOIN rfq_requests rfq ON rfq.customer_phone = cs.customer_phone
      LEFT JOIN email_messages em ON c.id = em.customer_id
      WHERE (cs.status != 'closed' OR cs.status IS NULL)
      GROUP BY cs.id, cs.customer_phone, cs.status, cs.last_message_at, 
               cs.assigned_staff_id, c.name, c.company, c.id, c.email
      ORDER BY cs.last_message_at DESC NULLS LAST
    `);
    
    console.log(`\n📱 Customer chat list with email notifications:`);
    
    if (chatResult.rows.length === 0) {
      console.log('❌ No chat sessions found');
    } else {
      chatResult.rows.forEach((chat, index) => {
        const emailCount = parseInt(chat.unread_email_count) || 0;
        const hasEmails = emailCount > 0;
        
        console.log(`\n${index + 1}. ${chat.customer_name || chat.customer_phone}`);
        console.log(`   Phone: ${chat.customer_phone}`);
        console.log(`   Email: ${chat.customer_email || 'No email'}`);
        console.log(`   Status: ${chat.session_status || 'Unknown'}`);
        console.log(`   Messages: ${chat.message_count}`);
        console.log(`   RFQs: ${chat.rfq_count}`);
        console.log(`   📧 Unread Emails: ${emailCount} ${hasEmails ? '🔔 NOTIFICATION!' : ''}`);
        
        if (hasEmails) {
          console.log(`   🎯 Should show blue email badge with ${emailCount} count`);
        }
      });
    }
    
    // Check specifically for Pieter Kemp (the test customer)
    const pieterCheck = await db.query(`
      SELECT c.id, c.name, c.email, c.phone,
             COUNT(em.id) as total_emails,
             COUNT(em.id) FILTER (WHERE em.direction = 'inbound' AND NOT em.is_read) as unread_emails,
             COUNT(cs.id) as chat_sessions
      FROM customers c
      LEFT JOIN email_messages em ON c.id = em.customer_id
      LEFT JOIN chat_sessions cs ON c.phone = cs.customer_phone
      WHERE c.email = 'pieter@mcmco.co.za'
      GROUP BY c.id, c.name, c.email, c.phone
    `);
    
    console.log(`\n🧪 Pieter Kemp Test Data:`);
    if (pieterCheck.rows.length === 0) {
      console.log('❌ Pieter Kemp customer not found');
    } else {
      const pieter = pieterCheck.rows[0];
      console.log(`✅ Customer: ${pieter.name} (${pieter.email})`);
      console.log(`📧 Total emails: ${pieter.total_emails}`);
      console.log(`🔴 Unread emails: ${pieter.unread_emails}`);
      console.log(`💬 Chat sessions: ${pieter.chat_sessions}`);
      
      if (pieter.unread_emails > 0) {
        console.log(`🎯 Expected: Blue email badge showing ${pieter.unread_emails} unread emails`);
      } else {
        console.log(`ℹ️ No unread emails - no badge should be shown`);
      }
    }
    
    // Check if there are any unread emails in the system
    const unreadEmailsResult = await db.query(`
      SELECT c.name, c.email, c.phone, COUNT(em.id) as unread_count
      FROM customers c
      JOIN email_messages em ON c.id = em.customer_id
      WHERE em.direction = 'inbound' AND NOT em.is_read
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY unread_count DESC
    `);
    
    console.log(`\n📧 All customers with unread emails:`);
    if (unreadEmailsResult.rows.length === 0) {
      console.log('✅ No unread emails in the system');
    } else {
      unreadEmailsResult.rows.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.name} (${customer.email}): ${customer.unread_count} unread emails`);
      });
    }
    
    await db.end();
    console.log('\n✅ Email notification test completed!');
    console.log('\n🔄 Refresh the dashboard to see email notification badges!');
  } catch (error) {
    console.error('❌ Error testing email notifications:', error.message);
    process.exit(1);
  }
}

testEmailNotifications();
