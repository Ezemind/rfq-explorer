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

async function addTestCustomerReply() {
  try {
    console.log('📧 Adding test customer reply...');
    
    // First, let me ask what email you're using for testing
    console.log('\n❓ PLEASE PROVIDE YOUR TEST EMAIL INFO:');
    console.log('1. What email address did you reply from?');
    console.log('2. What was the subject of your reply?');
    console.log('3. When did you send it (approximately)?');
    
    // For now, let me create a generic customer reply example
    // You can replace this with your actual details
    
    const testCustomerEmail = 'your-email@example.com'; // Replace with your email
    const replySubject = 'Re: 1234'; // Replace with your reply subject
    
    console.log('\n📝 Creating test customer record...');
    
    // Create or find the customer record
    let customer = await db.query(`
      SELECT id, name, email FROM customers WHERE email = $1 LIMIT 1
    `, [testCustomerEmail]);
    
    let customerId;
    if (customer.rows.length === 0) {
      // Create new customer
      const newCustomer = await db.query(`
        INSERT INTO customers (name, email, phone, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, name, email
      `, ['Test Customer (You)', testCustomerEmail, '+1234567890']);
      
      customerId = newCustomer.rows[0].id;
      console.log(`✅ Created new customer: ${newCustomer.rows[0].name} (ID: ${customerId})`);
    } else {
      customerId = customer.rows[0].id;
      console.log(`✅ Found existing customer: ${customer.rows[0].name} (ID: ${customerId})`);
    }
    
    // Get bob's email account
    const bobAccount = await db.query(`
      SELECT id, email_address FROM email_accounts 
      WHERE email_address = 'bob@mcmco.co.za' 
      LIMIT 1
    `);
    
    if (bobAccount.rows.length === 0) {
      console.log('❌ Bob email account not found');
      await db.end();
      return;
    }
    
    // Add your reply email
    const replyResult = await db.query(`
      INSERT INTO email_messages (
        email_account_id, customer_id, direction, from_email, to_emails,
        subject, body_text, body_html, received_at, is_read, created_at
      ) VALUES (
        $1, $2, 'inbound', $3, $4, $5, $6, $7, NOW() - INTERVAL '5 minutes', false, NOW()
      )
      RETURNING id
    `, [
      bobAccount.rows[0].id,
      customerId,
      testCustomerEmail,
      [bobAccount.rows[0].email_address],
      replySubject,
      `Hi Bob,\n\nThanks for your email. I wanted to follow up on this.\n\n[This is a test customer reply sent via Outlook]\n\nBest regards,\nTest Customer`,
      `<p>Hi Bob,</p><p>Thanks for your email. I wanted to follow up on this.</p><p><em>[This is a test customer reply sent via Outlook]</em></p><p>Best regards,<br/>Test Customer</p>`
    ]);
    
    if (replyResult.rowCount > 0) {
      console.log(`✅ Added customer reply email (ID: ${replyResult.rows[0].id})`);
      console.log('📧 Email details:');
      console.log(`   From: ${testCustomerEmail}`);
      console.log(`   To: ${bobAccount.rows[0].email_address}`);
      console.log(`   Subject: ${replySubject}`);
      console.log('   Status: Unread (will show red dot)');
      console.log('   Time: 5 minutes ago');
    }
    
    // Show the customer's complete email history
    const emailHistory = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, received_at, sent_at, is_read
      FROM email_messages 
      WHERE customer_id = $1 
      ORDER BY COALESCE(received_at, sent_at) DESC
    `, [customerId]);
    
    console.log(`\n📬 Customer email history (${emailHistory.rows.length} emails):`);
    emailHistory.rows.forEach((email, index) => {
      console.log(`${index + 1}. [${email.direction}] "${email.subject}"`);
      console.log(`   From: ${email.from_email} → To: ${email.to_emails}`);
      console.log(`   Time: ${email.received_at || email.sent_at} ${!email.is_read && email.direction === 'inbound' ? '🔴 UNREAD' : ''}`);
    });
    
    await db.end();
    console.log('\n✅ Test customer reply added!');
    console.log('\n🎯 TO TEST:');
    console.log('1. Open the customer panel for this customer');
    console.log('2. Go to the Emails tab');
    console.log('3. You should see the new reply with red unread indicator');
    console.log('4. Click "View" to see the full email content');
    
    console.log('\n📝 TO USE YOUR ACTUAL EMAIL:');
    console.log('1. Replace the testCustomerEmail variable with your actual email');
    console.log('2. Replace the replySubject with your actual reply subject');
    console.log('3. Run this script again');
  } catch (error) {
    console.error('❌ Error adding test customer reply:', error.message);
    process.exit(1);
  }
}

addTestCustomerReply();
