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

async function fixEmailLinking() {
  try {
    console.log('🔗 Fixing email linking for Pieter...');
    
    // Get Pieter's customer ID
    const pieter = await db.query(`
      SELECT id, name, email 
      FROM customers 
      WHERE email = 'pieter@mcmco.co.za'
      LIMIT 1
    `);
    
    if (pieter.rows.length === 0) {
      console.log('❌ Pieter customer not found');
      await db.end();
      return;
    }
    
    const pieterCustomer = pieter.rows[0];
    console.log(`✅ Found customer: ${pieterCustomer.name} (ID: ${pieterCustomer.id})`);
    
    // Find and link unlinked emails for Pieter
    const linkResult = await db.query(`
      UPDATE email_messages 
      SET customer_id = $1
      WHERE customer_id IS NULL
      AND (
        from_email = 'pieter@mcmco.co.za' OR 
        to_emails::text LIKE '%pieter@mcmco.co.za%'
      )
    `, [pieterCustomer.id]);
    
    console.log(`✅ Linked ${linkResult.rowCount} emails to ${pieterCustomer.name}`);
    
    // Check Pieter's current email count
    const emailCount = await db.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound,
             COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound,
             COUNT(CASE WHEN direction = 'inbound' AND NOT is_read THEN 1 END) as unread
      FROM email_messages
      WHERE customer_id = $1
    `, [pieterCustomer.id]);
    
    const stats = emailCount.rows[0];
    console.log(`\n📊 Pieter's email stats:`);
    console.log(`- Total emails: ${stats.total}`);
    console.log(`- Inbound: ${stats.inbound}`);
    console.log(`- Outbound: ${stats.outbound}`);
    console.log(`- Unread: ${stats.unread}`);
    
    // Show recent emails for Pieter
    const recentEmails = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, 
             received_at, sent_at, is_read
      FROM email_messages
      WHERE customer_id = $1
      ORDER BY COALESCE(received_at, sent_at) DESC
      LIMIT 5
    `, [pieterCustomer.id]);
    
    console.log(`\n📧 Pieter's recent emails:`);
    recentEmails.rows.forEach((email, index) => {
      const time = email.received_at || email.sent_at;
      const isRecent = new Date(time) > new Date(Date.now() - 2 * 60 * 60 * 1000);
      console.log(`${index + 1}. [${email.direction}] "${email.subject}" ${isRecent ? '🆕 RECENT' : ''}`);
      console.log(`   From: ${email.from_email}`);
      console.log(`   To: ${email.to_emails}`);
      console.log(`   Time: ${time} ${!email.is_read && email.direction === 'inbound' ? '🔴 UNREAD' : ''}`);
    });
    
    await db.end();
    console.log(`\n✅ Email linking fixed! ${pieterCustomer.name} now has ${stats.total} emails.`);
    console.log('\n🔄 Refresh the customer panel to see updated emails!');
  } catch (error) {
    console.error('❌ Error fixing email linking:', error.message);
    process.exit(1);
  }
}

fixEmailLinking();
