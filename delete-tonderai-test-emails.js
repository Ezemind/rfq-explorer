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

async function deleteTonderaiTestEmails() {
  try {
    console.log('🗑️ Deleting test emails for Tonderai Mutasa...');
    
    // First, find Tonderai's customer ID and emails
    const tonderai = await db.query(`
      SELECT id, name, email 
      FROM customers 
      WHERE name = 'Tonderai Mutasa' OR email = 'masawara@gmail.com'
      LIMIT 1
    `);
    
    if (tonderai.rows.length === 0) {
      console.log('❌ Tonderai Mutasa customer not found');
      await db.end();
      return;
    }
    
    const customer = tonderai.rows[0];
    console.log(`✅ Found customer: ${customer.name} (${customer.email}) - ID: ${customer.id}`);
    
    // Check current emails for this customer
    const currentEmails = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, received_at, sent_at
      FROM email_messages 
      WHERE customer_id = $1
      ORDER BY COALESCE(received_at, sent_at) DESC
    `, [customer.id]);
    
    console.log(`\n📧 Current emails for ${customer.name} (${currentEmails.rows.length} total):`);
    currentEmails.rows.forEach((email, index) => {
      console.log(`${index + 1}. [${email.direction}] "${email.subject}"`);
      console.log(`   From: ${email.from_email} → To: ${email.to_emails}`);
      console.log(`   Time: ${email.received_at || email.sent_at}`);
      console.log(`   Email ID: ${email.id}`);
    });
    
    // Delete all emails for this customer
    const deleteResult = await db.query(`
      DELETE FROM email_messages 
      WHERE customer_id = $1
    `, [customer.id]);
    
    console.log(`\n🗑️ Deleted ${deleteResult.rowCount} test emails for ${customer.name}`);
    
    // Verify deletion
    const remainingEmails = await db.query(`
      SELECT COUNT(*) as count 
      FROM email_messages 
      WHERE customer_id = $1
    `, [customer.id]);
    
    console.log(`✅ Remaining emails for ${customer.name}: ${remainingEmails.rows[0].count}`);
    
    // Show current state of all customer emails
    const allCustomerEmails = await db.query(`
      SELECT c.id, c.name, c.email,
             COUNT(em.id) as email_count
      FROM customers c
      LEFT JOIN email_messages em ON c.id = em.customer_id
      GROUP BY c.id, c.name, c.email
      ORDER BY COUNT(em.id) DESC
    `);
    
    console.log(`\n📊 Current email counts for all customers:`);
    allCustomerEmails.rows.forEach(cust => {
      if (cust.email_count > 0) {
        console.log(`- ${cust.name} (${cust.email}): ${cust.email_count} emails`);
      } else {
        console.log(`- ${cust.name} (${cust.email}): 0 emails ✅ CLEAN`);
      }
    });
    
    // Check for any unlinked emails that might be related
    const unlinkedEmails = await db.query(`
      SELECT COUNT(*) as count
      FROM email_messages 
      WHERE customer_id IS NULL
    `);
    
    console.log(`\n🔗 Unlinked emails in system: ${unlinkedEmails.rows[0].count}`);
    
    await db.end();
    console.log(`\n✅ Test email cleanup completed!`);
    console.log(`🧹 ${customer.name} now has a clean email history`);
    console.log(`\n🔄 Refresh the customer panel to see the cleaned state`);
  } catch (error) {
    console.error('❌ Error deleting test emails:', error.message);
    process.exit(1);
  }
}

deleteTonderaiTestEmails();
