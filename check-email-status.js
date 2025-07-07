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

async function checkEmailStatus() {
  try {
    console.log('🔍 Checking email system status...');
    
    // Check if the email account exists
    const accountResult = await db.query(`
      SELECT * FROM email_accounts WHERE email_address = 'bob@mcmco.co.za'
    `);
    
    if (accountResult.rows.length === 0) {
      console.log('❌ Email account bob@mcmco.co.za not found in database');
      console.log('\n📧 Available email accounts:');
      const allAccounts = await db.query('SELECT email_address, name, is_active FROM email_accounts');
      allAccounts.rows.forEach(acc => console.log(`  - ${acc.email_address} (${acc.name}) - Active: ${acc.is_active}`));
    } else {
      console.log('✅ Email account found:', accountResult.rows[0].name);
      console.log('   SMTP:', accountResult.rows[0].smtp_host, ':', accountResult.rows[0].smtp_port);
      console.log('   Active:', accountResult.rows[0].is_active);
    }
    
    // Check recent email messages
    console.log('\n📨 Recent email messages:');
    const messagesResult = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, sent_at, created_at
      FROM email_messages 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (messagesResult.rows.length === 0) {
      console.log('❌ No email messages found in database');
      console.log('💡 This suggests emails are not being saved to the database');
    } else {
      messagesResult.rows.forEach(msg => {
        console.log(`  ${msg.direction}: From ${msg.from_email} to ${msg.to_emails} - ${msg.subject || 'No Subject'}`);
        console.log(`    Sent: ${msg.sent_at || 'Not sent'} | Created: ${msg.created_at}`);
      });
    }
    
    // Check for any email campaigns/scheduled emails
    console.log('\n📅 Email campaigns:');
    const campaignsResult = await db.query(`
      SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 5
    `);
    
    if (campaignsResult.rows.length === 0) {
      console.log('❌ No email campaigns found');
    } else {
      campaignsResult.rows.forEach(camp => {
        console.log(`  Campaign: ${camp.name} - Status: ${camp.status}`);
      });
    }

    // Check if there are any errors in the system
    console.log('\n🔧 System Analysis:');
    console.log('1. Email account configuration needed for real SMTP');
    console.log('2. Current system only saves to database (no actual SMTP sending)');
    console.log('3. For real email delivery, configure SMTP credentials');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error checking email status:', error.message);
  }
}

checkEmailStatus();
