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

async function checkRecentEmailActivity() {
  try {
    console.log('🔍 Checking for recent email activity...');
    
    // Check if any emails were added recently (last 30 minutes)
    const recentEmails = await db.query(`
      SELECT em.id, em.direction, em.from_email, em.to_emails, em.subject, 
             em.received_at, em.sent_at, em.created_at, em.customer_id,
             c.name as customer_name, c.email as customer_email,
             ea.email_address as account_email
      FROM email_messages em
      LEFT JOIN customers c ON em.customer_id = c.id
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      WHERE em.created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY em.created_at DESC
    `);
    
    console.log(`\n📧 Recent email activity (last 30 minutes): ${recentEmails.rows.length} emails`);
    
    if (recentEmails.rows.length === 0) {
      console.log('❌ No recent emails found in database');
      console.log('💡 This suggests the email sending is not saving to database');
    } else {
      recentEmails.rows.forEach((email, index) => {
        console.log(`\n${index + 1}. [${email.direction}] "${email.subject}"`);
        console.log(`   From: ${email.from_email}`);
        console.log(`   To: ${email.to_emails}`);
        console.log(`   Time: ${email.sent_at || email.received_at}`);
        console.log(`   Customer: ${email.customer_name || 'NOT LINKED'} (${email.customer_email || 'N/A'})`);
        console.log(`   Account: ${email.account_email}`);
        console.log(`   Created: ${email.created_at}`);
        console.log(`   Email ID: ${email.id}`);
      });
    }
    
    // Check specifically for Pieter Kemp customer
    const pieter = await db.query(`
      SELECT id, name, email FROM customers 
      WHERE email = 'pieter@mcmco.co.za' 
      LIMIT 1
    `);
    
    if (pieter.rows.length > 0) {
      const customer = pieter.rows[0];
      console.log(`\n👤 Customer: ${customer.name} (${customer.email}) - ID: ${customer.id}`);
      
      // Check emails for this customer
      const customerEmails = await db.query(`
        SELECT id, direction, from_email, to_emails, subject, sent_at, received_at
        FROM email_messages 
        WHERE customer_id = $1
        ORDER BY COALESCE(sent_at, received_at) DESC
      `, [customer.id]);
      
      console.log(`📬 ${customer.name}'s emails: ${customerEmails.rows.length}`);
      if (customerEmails.rows.length > 0) {
        customerEmails.rows.forEach((email, index) => {
          console.log(`  ${index + 1}. [${email.direction}] "${email.subject}"`);
          console.log(`     From: ${email.from_email} → To: ${email.to_emails}`);
          console.log(`     Time: ${email.sent_at || email.received_at}`);
        });
      }
    }
    
    // Check email accounts to make sure they exist
    const accounts = await db.query(`
      SELECT id, name, email_address, is_active, is_default
      FROM email_accounts 
      WHERE is_active = true
      ORDER BY is_default DESC
    `);
    
    console.log(`\n📧 Active email accounts: ${accounts.rows.length}`);
    accounts.rows.forEach(acc => {
      console.log(`- ${acc.name}: ${acc.email_address} ${acc.is_default ? '[DEFAULT]' : ''}`);
    });
    
    // Check if there are any emails at all in the system
    const totalEmails = await db.query(`SELECT COUNT(*) as count FROM email_messages`);
    console.log(`\n📊 Total emails in system: ${totalEmails.rows[0].count}`);
    
    await db.end();
    console.log('\n✅ Email activity check completed!');
    
    if (recentEmails.rows.length === 0) {
      console.log('\n💡 ISSUE IDENTIFIED:');
      console.log('The email sending function is not saving sent emails to the database.');
      console.log('This means:');
      console.log('1. Email might be sent via SMTP successfully');
      console.log('2. But not recorded in email_messages table');
      console.log('3. So it won\'t appear in customer email history');
      console.log('\n🔧 SOLUTION:');
      console.log('Need to fix the email sending function to properly save sent emails.');
    }
  } catch (error) {
    console.error('❌ Error checking email activity:', error.message);
    process.exit(1);
  }
}

checkRecentEmailActivity();
