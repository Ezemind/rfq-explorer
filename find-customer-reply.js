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

async function findCustomerReply() {
  try {
    console.log('🔍 Looking for customer reply emails...');
    
    // First, let's see who this customer is (the current chat user)
    console.log('🔍 Checking for recent customer activity...');
    
    // Check all recent inbound emails to bob@mcmco.co.za
    const recentInbound = await db.query(`
      SELECT em.id, em.from_email, em.to_emails, em.subject, 
             em.received_at, em.body_text, em.customer_id, c.name as customer_name
      FROM email_messages em
      LEFT JOIN customers c ON em.customer_id = c.id
      WHERE em.direction = 'inbound'
      AND em.to_emails::text LIKE '%bob@mcmco.co.za%'
      AND em.received_at > NOW() - INTERVAL '6 hours'
      ORDER BY em.received_at DESC
    `);
    
    console.log(`\n📧 Recent inbound emails to bob@mcmco.co.za (last 6 hours):`);
    if (recentInbound.rows.length === 0) {
      console.log('❌ No recent inbound emails found');
    } else {
      recentInbound.rows.forEach((email, index) => {
        console.log(`\n${index + 1}. From: ${email.from_email}`);
        console.log(`   Subject: "${email.subject}"`);
        console.log(`   Time: ${email.received_at}`);
        console.log(`   Customer: ${email.customer_name || 'NOT LINKED'}`);
        console.log(`   Preview: ${email.body_text?.substring(0, 100)}...`);
        console.log(`   Email ID: ${email.id}`);
      });
    }
    
    // Check for any unlinked inbound emails
    const unllinkedInbound = await db.query(`
      SELECT em.id, em.from_email, em.to_emails, em.subject, 
             em.received_at, em.body_text
      FROM email_messages em
      WHERE em.direction = 'inbound'
      AND em.customer_id IS NULL
      AND em.to_emails::text LIKE '%bob@mcmco.co.za%'
      ORDER BY em.received_at DESC
      LIMIT 10
    `);
    
    console.log(`\n🔗 Unlinked inbound emails to bob@mcmco.co.za:`);
    if (unllinkedInbound.rows.length === 0) {
      console.log('✅ No unlinked inbound emails found');
    } else {
      for (const email of unllinkedInbound.rows) {
        console.log(`\n- From: ${email.from_email}`);
        console.log(`  Subject: "${email.subject}"`);
        console.log(`  Time: ${email.received_at}`);
        console.log(`  Preview: ${email.body_text?.substring(0, 100)}...`);
        console.log(`  Email ID: ${email.id}`);
        
        // Try to find a matching customer for this email
        const matchingCustomer = await db.query(`
          SELECT id, name, email, phone 
          FROM customers 
          WHERE email = $1
          LIMIT 1
        `, [email.from_email]);
        
        if (matchingCustomer.rows.length > 0) {
          const customer = matchingCustomer.rows[0];
          console.log(`  🎯 FOUND MATCHING CUSTOMER: ${customer.name} (${customer.email})`);
          
          // Link this email to the customer
          const linkResult = await db.query(`
            UPDATE email_messages 
            SET customer_id = $1
            WHERE id = $2
          `, [customer.id, email.id]);
          
          if (linkResult.rowCount > 0) {
            console.log(`  ✅ LINKED email ${email.id} to customer ${customer.name}`);
          }
        } else {
          console.log(`  ❌ No customer found for email: ${email.from_email}`);
          
          // Check if there's a similar email in customers
          const similarCustomer = await db.query(`
            SELECT id, name, email, phone 
            FROM customers 
            WHERE email ILIKE $1 OR name ILIKE $2
            LIMIT 3
          `, [`%${email.from_email.split('@')[0]}%`, `%${email.from_email.split('@')[0]}%`]);
          
          if (similarCustomer.rows.length > 0) {
            console.log(`  💡 Similar customers found:`);
            similarCustomer.rows.forEach(cust => {
              console.log(`     - ${cust.name} (${cust.email})`);
            });
          }
        }
      }
    }
    
    // Show current customer in panel (try to detect based on recent activity)
    const currentCustomer = await db.query(`
      SELECT c.id, c.name, c.email, c.phone,
             COUNT(em.id) as email_count,
             MAX(em.received_at) as last_email
      FROM customers c
      LEFT JOIN email_messages em ON c.id = em.customer_id
      GROUP BY c.id, c.name, c.email, c.phone
      HAVING COUNT(em.id) > 0
      ORDER BY MAX(em.received_at) DESC
      LIMIT 5
    `);
    
    console.log(`\n👤 Customers with recent email activity:`);
    currentCustomer.rows.forEach((cust, index) => {
      console.log(`${index + 1}. ${cust.name} (${cust.email}) - ${cust.email_count} emails, last: ${cust.last_email}`);
    });
    
    await db.end();
    console.log('\n✅ Customer reply search completed!');
    console.log('\n💡 If your reply was found and linked, refresh the customer panel to see it!');
  } catch (error) {
    console.error('❌ Error finding customer reply:', error.message);
    process.exit(1);
  }
}

findCustomerReply();
