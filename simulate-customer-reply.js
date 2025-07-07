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

async function simulateCustomerReply() {
  try {
    console.log('🔄 Simulating customer reply email...');
    
    // Find the customer we added test data for
    const customer = await db.query(`
      SELECT id, name, email, phone 
      FROM customers 
      WHERE email = 'masawara@gmail.com'
      LIMIT 1
    `);
    
    if (customer.rows.length === 0) {
      console.log('❌ Test customer not found');
      await db.end();
      return;
    }
    
    const customerData = customer.rows[0];
    console.log(`✅ Found customer: ${customerData.name} (${customerData.email})`);
    
    // Get the bob email account
    const emailAccount = await db.query(`
      SELECT id, email_address 
      FROM email_accounts 
      WHERE email_address = 'bob@mcmco.co.za'
      LIMIT 1
    `);
    
    if (emailAccount.rows.length === 0) {
      console.log('❌ Bob email account not found');
      await db.end();
      return;
    }
    
    // Add a very recent customer reply (simulate IMAP sync)
    const replyResult = await db.query(`
      INSERT INTO email_messages (
        email_account_id,
        customer_id,
        direction,
        from_email,
        to_emails,
        subject,
        body_text,
        body_html,
        received_at,
        is_read,
        created_at
      ) VALUES (
        $1, $2, 'inbound', $3, $4, $5, $6, $7, NOW(), false, NOW()
      )
      RETURNING id
    `, [
      emailAccount.rows[0].id,
      customerData.id,
      customerData.email,
      [emailAccount.rows[0].email_address],
      'Re: Welcome to MCM - Thank you for the quote!',
      'Hi Bob,\n\nThank you so much for the comprehensive quote! I have reviewed everything and I am very impressed.\n\nI would like to proceed with the order. Please let me know the next steps for payment and delivery.\n\nAlso, do you have any current promotions or bulk discounts available?\n\nLooking forward to working with you!\n\nBest regards,\n' + customerData.name + '\n\nSent from my mobile device',
      '<p>Hi Bob,</p><p>Thank you so much for the comprehensive quote! I have reviewed everything and I am very impressed.</p><p>I would like to proceed with the order. Please let me know the next steps for payment and delivery.</p><p>Also, do you have any current promotions or bulk discounts available?</p><p>Looking forward to working with you!</p><p>Best regards,<br/>' + customerData.name + '<br/><em>Sent from my mobile device</em></p>'
    ]);
    
    if (replyResult.rowCount > 0) {
      console.log('✅ Added simulated customer reply email');
      console.log(`📧 Email ID: ${replyResult.rows[0].id}`);
      console.log('📱 Marked as unread (will show red dot)');
      console.log('🕐 Timestamp: Just now');
    }
    
    // Also add another quick follow-up from customer
    const followupResult = await db.query(`
      INSERT INTO email_messages (
        email_account_id,
        customer_id,
        direction,
        from_email,
        to_emails,
        subject,
        body_text,
        body_html,
        received_at,
        is_read,
        created_at
      ) VALUES (
        $1, $2, 'inbound', $3, $4, $5, $6, $7, NOW() - INTERVAL '5 minutes', false, NOW()
      )
      RETURNING id
    `, [
      emailAccount.rows[0].id,
      customerData.id,
      customerData.email,
      [emailAccount.rows[0].email_address],
      'Quick question about delivery times',
      'Hi again,\n\nJust a quick follow-up question - what are the typical delivery times for orders to Johannesburg?\n\nThanks!\n' + customerData.name,
      '<p>Hi again,</p><p>Just a quick follow-up question - what are the typical delivery times for orders to Johannesburg?</p><p>Thanks!<br/>' + customerData.name + '</p>'
    ]);
    
    if (followupResult.rowCount > 0) {
      console.log('✅ Added second customer email (5 minutes ago)');
      console.log(`📧 Email ID: ${followupResult.rows[0].id}`);
    }
    
    console.log('\n🎯 Customer Reply Simulation Complete!');
    console.log(`Customer: ${customerData.name} (${customerData.email})`);
    console.log('- 1 new reply email (just now) - about proceeding with order');
    console.log('- 1 follow-up email (5 min ago) - about delivery times');
    console.log('- Both marked as unread');
    console.log('\n📱 These emails should now appear in the customer panel!');
    console.log('🔴 Look for red unread indicators');
    console.log('🔄 Try the refresh button to see new emails');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error simulating customer reply:', error.message);
    process.exit(1);
  }
}

simulateCustomerReply();
