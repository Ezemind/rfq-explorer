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

async function cleanupEmailLinking() {
  try {
    console.log('🧹 Cleaning up incorrect email linking...');
    
    // Find all customers and their emails
    const customers = await db.query(`
      SELECT c.id, c.name, c.email, c.phone,
             COUNT(em.id) as total_emails
      FROM customers c
      LEFT JOIN email_messages em ON c.id = em.customer_id
      GROUP BY c.id, c.name, c.email, c.phone
      HAVING COUNT(em.id) > 0
      ORDER BY COUNT(em.id) DESC
    `);
    
    console.log('\n👥 Customers with emails:');
    customers.rows.forEach(cust => {
      console.log(`- ${cust.name} (${cust.email}) - ${cust.total_emails} emails`);
    });
    
    // Check for incorrectly linked emails
    for (const customer of customers.rows) {
      console.log(`\n🔍 Checking emails for ${customer.name} (${customer.email})...`);
      
      const customerEmails = await db.query(`
        SELECT id, direction, from_email, to_emails, subject, received_at, sent_at
        FROM email_messages 
        WHERE customer_id = $1
        ORDER BY COALESCE(received_at, sent_at) DESC
      `, [customer.id]);
      
      let correctEmails = 0;
      let incorrectEmails = 0;
      const emailsToUnlink = [];
      
      for (const email of customerEmails.rows) {
        // Check if this email is actually a conversation with this customer
        const isCorrectEmail = (
          // Outbound: from business to customer
          (email.direction === 'outbound' && email.to_emails?.includes(customer.email)) ||
          // Inbound: from customer to business
          (email.direction === 'inbound' && email.from_email === customer.email)
        );
        
        if (isCorrectEmail) {
          correctEmails++;
          console.log(`  ✅ [${email.direction}] "${email.subject}" - CORRECT`);
        } else {
          incorrectEmails++;
          console.log(`  ❌ [${email.direction}] "${email.subject}" - INCORRECT`);
          console.log(`     From: ${email.from_email}, To: ${email.to_emails}`);
          console.log(`     Should not be linked to ${customer.name} (${customer.email})`);
          emailsToUnlink.push(email.id);
        }
      }
      
      console.log(`  📊 Summary: ${correctEmails} correct, ${incorrectEmails} incorrect`);
      
      // Unlink incorrect emails
      if (emailsToUnlink.length > 0) {
        const unlinkResult = await db.query(`
          UPDATE email_messages 
          SET customer_id = NULL 
          WHERE id = ANY($1)
        `, [emailsToUnlink]);
        
        console.log(`  🔧 Unlinked ${unlinkResult.rowCount} incorrect emails`);
      }
    }
    
    // Now show the cleaned up email counts
    console.log('\n📊 After cleanup:');
    const cleanedCustomers = await db.query(`
      SELECT c.id, c.name, c.email,
             COUNT(em.id) as total_emails,
             COUNT(CASE WHEN em.direction = 'inbound' THEN 1 END) as inbound,
             COUNT(CASE WHEN em.direction = 'outbound' THEN 1 END) as outbound
      FROM customers c
      LEFT JOIN email_messages em ON c.id = em.customer_id
      GROUP BY c.id, c.name, c.email
      HAVING COUNT(em.id) > 0
      ORDER BY COUNT(em.id) DESC
    `);
    
    cleanedCustomers.rows.forEach(cust => {
      console.log(`- ${cust.name} (${cust.email}): ${cust.total_emails} emails (${cust.inbound} in, ${cust.outbound} out)`);
    });
    
    // Check for unlinked emails that might need proper linking
    const unlinkedEmails = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, received_at, sent_at
      FROM email_messages 
      WHERE customer_id IS NULL
      ORDER BY COALESCE(received_at, sent_at) DESC
      LIMIT 10
    `);
    
    console.log(`\n🔗 Unlinked emails that might need proper customer matching:`);
    if (unlinkedEmails.rows.length === 0) {
      console.log('✅ No unlinked emails found');
    } else {
      for (const email of unlinkedEmails.rows) {
        console.log(`\n- [${email.direction}] "${email.subject}"`);
        console.log(`  From: ${email.from_email}`);
        console.log(`  To: ${email.to_emails}`);
        console.log(`  Time: ${email.received_at || email.sent_at}`);
        
        // Try to find correct customer for inbound emails
        if (email.direction === 'inbound') {
          const matchingCustomer = await db.query(`
            SELECT id, name, email FROM customers WHERE email = $1 LIMIT 1
          `, [email.from_email]);
          
          if (matchingCustomer.rows.length > 0) {
            console.log(`  💡 Could link to: ${matchingCustomer.rows[0].name} (${matchingCustomer.rows[0].email})`);
          } else {
            console.log(`  ❓ No customer found for: ${email.from_email}`);
          }
        }
      }
    }
    
    await db.end();
    console.log('\n✅ Email cleanup completed!');
    console.log('\n🔄 Refresh the customer panel to see cleaned up email history!');
  } catch (error) {
    console.error('❌ Error cleaning up emails:', error.message);
    process.exit(1);
  }
}

cleanupEmailLinking();
