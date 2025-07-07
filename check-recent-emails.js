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

async function checkForNewEmails() {
  try {
    console.log('🔍 Checking for recent emails that might not be linked...');
    
    // Check for recent emails in the last 2 hours
    const recentEmails = await db.query(`
      SELECT em.id, em.direction, em.from_email, em.to_emails, em.subject, 
             em.received_at, em.sent_at, em.customer_id, c.name as customer_name,
             ea.email_address as account_email
      FROM email_messages em
      LEFT JOIN customers c ON em.customer_id = c.id
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      WHERE (em.received_at > NOW() - INTERVAL '2 hours' OR em.sent_at > NOW() - INTERVAL '2 hours')
      ORDER BY COALESCE(em.received_at, em.sent_at) DESC
    `);
    
    console.log('\n📧 Recent emails (last 2 hours):');
    if (recentEmails.rows.length === 0) {
      console.log('❌ No recent emails found');
    } else {
      recentEmails.rows.forEach((email, index) => {
        console.log(`\n${index + 1}. [${email.direction}] "${email.subject}"`);
        console.log(`   From: ${email.from_email}`);
        console.log(`   To: ${email.to_emails}`);
        console.log(`   Time: ${email.received_at || email.sent_at}`);
        console.log(`   Customer: ${email.customer_name || 'NOT LINKED'}`);
        console.log(`   Account: ${email.account_email}`);
      });
    }
    
    // Check for emails that might match Pieter but aren't linked
    const unllinkedEmails = await db.query(`
      SELECT em.id, em.direction, em.from_email, em.to_emails, em.subject, 
             em.received_at, em.sent_at, em.customer_id
      FROM email_messages em
      WHERE em.customer_id IS NULL
      AND (
        em.from_email ILIKE '%pieter%' OR 
        em.to_emails::text ILIKE '%pieter%' OR
        em.from_email ILIKE '%mcmco%' OR 
        em.to_emails::text ILIKE '%mcmco%'
      )
      ORDER BY COALESCE(em.received_at, em.sent_at) DESC
      LIMIT 10
    `);
    
    console.log('\n🔗 Unlinked emails that might be relevant:');
    if (unllinkedEmails.rows.length === 0) {
      console.log('✅ No unlinked emails found');
    } else {
      unllinkedEmails.rows.forEach((email, index) => {
        console.log(`\n${index + 1}. [${email.direction}] "${email.subject}"`);
        console.log(`   From: ${email.from_email}`);
        console.log(`   To: ${email.to_emails}`);
        console.log(`   Time: ${email.received_at || email.sent_at}`);
        console.log(`   Email ID: ${email.id} (NOT LINKED TO CUSTOMER)`);
      });
    }
    
    // Check the specific customer
    const customer = await db.query(`
      SELECT id, name, email, phone 
      FROM customers 
      WHERE email = 'pieter@mcmco.co.za' OR name ILIKE '%pieter%'
      LIMIT 5
    `);
    
    console.log('\n👤 Pieter-related customers:');
    customer.rows.forEach(cust => {
      console.log(`- ${cust.name} (${cust.email}) - ID: ${cust.id}`);
    });
    
    // Check IMAP sync status
    const lastSync = await db.query(`
      SELECT ea.email_address, ea.last_imap_sync, 
             COUNT(em.id) as email_count_today
      FROM email_accounts ea
      LEFT JOIN email_messages em ON ea.id = em.email_account_id 
        AND em.received_at > CURRENT_DATE
      GROUP BY ea.id, ea.email_address, ea.last_imap_sync
    `);
    
    console.log('\n🔄 IMAP Sync Status:');
    lastSync.rows.forEach(acc => {
      console.log(`- ${acc.email_address}: Last sync ${acc.last_imap_sync || 'Never'}, ${acc.email_count_today} emails today`);
    });
    
    await db.end();
    console.log('\n✅ Email check completed!');
  } catch (error) {
    console.error('❌ Error checking emails:', error.message);
    process.exit(1);
  }
}

checkForNewEmails();
