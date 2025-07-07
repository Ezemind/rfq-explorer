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

async function finalEmailCleanup() {
  try {
    console.log('🧹 Final email system cleanup...');
    
    // Check current state
    const allEmails = await db.query(`
      SELECT em.id, em.direction, em.from_email, em.to_emails, em.subject, 
             em.customer_id, c.name as customer_name, c.email as customer_email
      FROM email_messages em
      LEFT JOIN customers c ON em.customer_id = c.id
      ORDER BY em.customer_id, COALESCE(em.received_at, em.sent_at) DESC
    `);
    
    console.log(`\n📧 Current email system state (${allEmails.rows.length} total emails):`);
    
    const emailsByCustomer = {};
    const unlinkedEmails = [];
    
    allEmails.rows.forEach(email => {
      if (email.customer_id) {
        if (!emailsByCustomer[email.customer_id]) {
          emailsByCustomer[email.customer_id] = {
            customer: email.customer_name,
            email: email.customer_email,
            emails: []
          };
        }
        emailsByCustomer[email.customer_id].emails.push(email);
      } else {
        unlinkedEmails.push(email);
      }
    });
    
    // Show emails by customer
    console.log('\n👥 Emails by customer:');
    for (const [customerId, data] of Object.entries(emailsByCustomer)) {
      console.log(`\n📋 ${data.customer} (${data.email}) - ${data.emails.length} emails:`);
      data.emails.forEach((email, index) => {
        console.log(`  ${index + 1}. [${email.direction}] "${email.subject}"`);
        console.log(`     From: ${email.from_email} → To: ${email.to_emails}`);
        console.log(`     ID: ${email.id}`);
        
        // Check if this email makes sense for this customer
        const isCorrectLink = (
          (email.direction === 'outbound' && email.to_emails?.includes(data.email)) ||
          (email.direction === 'inbound' && email.from_email === data.email)
        );
        
        if (!isCorrectLink) {
          console.log(`     ❌ INCORRECT LINK - should be unlinked`);
        } else {
          console.log(`     ✅ CORRECT LINK`);
        }
      });
    }
    
    // Show unlinked emails
    console.log(`\n🔗 Unlinked emails (${unlinkedEmails.length}):`);
    unlinkedEmails.forEach((email, index) => {
      console.log(`${index + 1}. [${email.direction}] "${email.subject}"`);
      console.log(`   From: ${email.from_email} → To: ${email.to_emails}`);
      console.log(`   ID: ${email.id}`);
    });
    
    // Option to clean everything for testing
    console.log('\n🗑️ CLEANING ALL TEST EMAILS...');
    console.log('This will remove all emails to start fresh for testing.');
    
    // Delete all emails to start clean
    const deleteResult = await db.query('DELETE FROM email_messages');
    console.log(`✅ Deleted ${deleteResult.rowCount} emails from the system`);
    
    // Verify clean state
    const remainingEmails = await db.query('SELECT COUNT(*) as count FROM email_messages');
    console.log(`📊 Remaining emails in system: ${remainingEmails.rows[0].count}`);
    
    // Show customer summary
    const customerSummary = await db.query(`
      SELECT c.id, c.name, c.email, c.phone,
             COUNT(em.id) as email_count
      FROM customers c
      LEFT JOIN email_messages em ON c.id = em.customer_id
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY c.name
    `);
    
    console.log(`\n👥 All customers now have clean email history:`);
    customerSummary.rows.forEach(cust => {
      console.log(`- ${cust.name} (${cust.email || 'no email'}): ${cust.email_count} emails ✅`);
    });
    
    await db.end();
    console.log('\n✅ Email system is now completely clean!');
    console.log('🎯 Ready for testing real customer email detection');
    console.log('\n📝 Next steps:');
    console.log('1. Send a test email to a customer from bob@mcmco.co.za');
    console.log('2. Have the customer reply via their email client');
    console.log('3. Use IMAP sync to detect the reply');
    console.log('4. See the conversation appear in the customer panel');
  } catch (error) {
    console.error('❌ Error in final cleanup:', error.message);
    process.exit(1);
  }
}

finalEmailCleanup();
