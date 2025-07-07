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

async function testEmailQuery() {
  try {
    console.log('🔍 Testing the customer email query...');
    
    const customerId = 1; // Pieter Kemp's ID
    const customerEmail = 'pieter@mcmco.co.za';
    
    console.log(`Testing for Customer ID: ${customerId}, Email: ${customerEmail}`);
    
    // Test the current query from the frontend
    console.log('\n🧪 Testing current frontend query:');
    const currentQuery = await db.query(`
      SELECT em.*, ea.email_address as account_email, ea.name as account_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      WHERE em.customer_id = $1
      AND (
        (em.direction = 'outbound' AND em.from_email = ea.email_address AND em.to_emails::text LIKE $2) OR
        (em.direction = 'inbound' AND em.from_email = $2 AND em.to_emails::text LIKE '%' || ea.email_address || '%')
      )
      ORDER BY em.received_at DESC, em.sent_at DESC
      LIMIT 20
    `, [customerId, customerEmail]);
    
    console.log(`Result: ${currentQuery.rows.length} emails found`);
    currentQuery.rows.forEach((email, index) => {
      console.log(`  ${index + 1}. [${email.direction}] "${email.subject}"`);
      console.log(`     From: ${email.from_email} → To: ${email.to_emails}`);
      console.log(`     Account: ${email.account_email}`);
    });
    
    // Test a simpler query 
    console.log('\n🧪 Testing simple query (what should work):');
    const simpleQuery = await db.query(`
      SELECT em.*, ea.email_address as account_email, ea.name as account_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      WHERE em.customer_id = $1
      ORDER BY em.received_at DESC, em.sent_at DESC
      LIMIT 20
    `, [customerId]);
    
    console.log(`Result: ${simpleQuery.rows.length} emails found`);
    simpleQuery.rows.forEach((email, index) => {
      console.log(`  ${index + 1}. [${email.direction}] "${email.subject}"`);
      console.log(`     From: ${email.from_email} → To: ${email.to_emails}`);
      console.log(`     Account: ${email.account_email}`);
    });
    
    // Debug the specific email
    console.log('\n🔍 Debug the specific email:');
    const specificEmail = await db.query(`
      SELECT em.*, ea.email_address as account_email, ea.name as account_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      WHERE em.id = 26
    `);
    
    if (specificEmail.rows.length > 0) {
      const email = specificEmail.rows[0];
      console.log('Email details:');
      console.log(`- ID: ${email.id}`);
      console.log(`- Direction: ${email.direction}`);
      console.log(`- From: ${email.from_email}`);
      console.log(`- To: ${email.to_emails}`);
      console.log(`- Customer ID: ${email.customer_id}`);
      console.log(`- Account Email: ${email.account_email}`);
      console.log(`- Subject: ${email.subject}`);
      
      // Test each condition
      console.log('\n🧪 Testing filter conditions:');
      console.log(`1. customer_id = ${customerId}: ${email.customer_id === customerId}`);
      console.log(`2. direction = 'outbound': ${email.direction === 'outbound'}`);
      console.log(`3. from_email = account_email: ${email.from_email} = ${email.account_email} → ${email.from_email === email.account_email}`);
      console.log(`4. to_emails contains '${customerEmail}': ${email.to_emails?.includes ? email.to_emails.includes(customerEmail) : 'N/A'}`);
      
      const condition1 = email.direction === 'outbound' && email.from_email === email.account_email && email.to_emails?.includes(customerEmail);
      const condition2 = email.direction === 'inbound' && email.from_email === customerEmail;
      
      console.log(`Outbound condition met: ${condition1}`);
      console.log(`Inbound condition met: ${condition2}`);
      console.log(`Should be included: ${condition1 || condition2}`);
    }
    
    await db.end();
    console.log('\n✅ Email query test completed!');
  } catch (error) {
    console.error('❌ Error testing email query:', error.message);
    process.exit(1);
  }
}

testEmailQuery();
