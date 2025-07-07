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

async function checkEmailCustomerLinkage() {
  try {
    console.log('🔍 Checking email-customer linkage...');
    
    // Check recent test emails
    const emailResult = await db.query(`
      SELECT em.*, c.name as customer_name, c.phone as customer_phone
      FROM email_messages em
      LEFT JOIN customers c ON em.customer_id = c.id
      WHERE em.subject LIKE '%test%'
      ORDER BY em.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📧 Recent test emails:');
    emailResult.rows.forEach(email => {
      console.log(`- Subject: ${email.subject}`);
      console.log(`  To: ${email.to_emails}`);
      console.log(`  Customer ID: ${email.customer_id}`);
      console.log(`  Customer Name: ${email.customer_name || 'NULL'}`);
      console.log(`  Customer Phone: ${email.customer_phone || 'NULL'}`);
      console.log('');
    });
    
    // Check if customer exists for the email addresses
    console.log('👤 Checking customers with matching emails:');
    const customerResult = await db.query(`
      SELECT id, name, email, phone 
      FROM customers 
      WHERE email IN ('pieter@mcmco.co.za', 'pieter@k-designs.co.za')
      ORDER BY name
    `);
    
    if (customerResult.rows.length === 0) {
      console.log('❌ No customers found with those email addresses');
      console.log('💡 This explains why emails aren\'t linked to customers');
    } else {
      customerResult.rows.forEach(customer => {
        console.log(`- ${customer.name} (${customer.email}) - Phone: ${customer.phone}`);
      });
    }
    
    // Check the email linking logic in the customer panel query
    console.log('\n🔍 Testing customer email query logic...');
    
    // Test the query used in CustomerPanel for a specific customer
    const testCustomerPhone = '27744203713'; // Example phone number
    const customerEmailResult = await db.query(`
      SELECT em.*, ea.email_address as account_email, c.name as customer_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      LEFT JOIN customers c ON em.customer_id = c.id
      WHERE (em.customer_id = (SELECT id FROM customers WHERE phone = $1) 
             OR em.from_email = (SELECT email FROM customers WHERE phone = $1) 
             OR $1 = ANY(em.to_emails))
      ORDER BY em.received_at DESC, em.sent_at DESC
      LIMIT 5
    `, [testCustomerPhone]);
    
    console.log(`Emails for customer ${testCustomerPhone}:`, customerEmailResult.rows.length);
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEmailCustomerLinkage();
