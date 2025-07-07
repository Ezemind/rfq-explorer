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

async function addTestEmailIfNeeded() {
  try {
    console.log('🧪 Adding test email for UI testing...');
    
    // Check if we have a customer with an email
    const customers = await db.query(`
      SELECT id, name, email, phone 
      FROM customers 
      WHERE email IS NOT NULL 
      LIMIT 1
    `);
    
    if (customers.rows.length === 0) {
      console.log('❌ No customers with email found');
      await db.end();
      return;
    }
    
    const customer = customers.rows[0];
    console.log(`✅ Found customer: ${customer.name} (${customer.email})`);
    
    // Check if this customer already has email history
    const existingEmails = await db.query(`
      SELECT COUNT(*) as count 
      FROM email_messages 
      WHERE customer_id = $1
    `, [customer.id]);
    
    if (existingEmails.rows[0].count > 0) {
      console.log(`✅ Customer already has ${existingEmails.rows[0].count} emails in history`);
      await db.end();
      return;
    }
    
    // Get an email account to use
    const emailAccount = await db.query(`
      SELECT id, email_address 
      FROM email_accounts 
      WHERE is_active = true 
      LIMIT 1
    `);
    
    if (emailAccount.rows.length === 0) {
      console.log('❌ No active email accounts found');
      await db.end();
      return;
    }
    
    // Add a test sent email
    const testEmailResult = await db.query(`
      INSERT INTO email_messages (
        email_account_id,
        customer_id,
        direction,
        from_email,
        to_emails,
        subject,
        body_text,
        body_html,
        sent_at,
        is_read,
        created_at
      ) VALUES (
        $1, $2, 'outbound', $3, $4, $5, $6, $7, NOW() - INTERVAL '2 hours', true, NOW()
      )
    `, [
      emailAccount.rows[0].id,
      customer.id,
      emailAccount.rows[0].email_address,
      [customer.email],
      'Welcome to MCM - Your Quote is Ready!',
      'Dear ' + customer.name + ',\n\nThank you for your recent inquiry. We have prepared a comprehensive quote for the products you requested.\n\nPlease find the details attached to this email. If you have any questions, feel free to reach out to our team.\n\nBest regards,\nMCM Team',
      '<p>Dear ' + customer.name + ',</p><p>Thank you for your recent inquiry. We have prepared a comprehensive quote for the products you requested.</p><p>Please find the details attached to this email. If you have any questions, feel free to reach out to our team.</p><p>Best regards,<br/>MCM Team</p>'
    ]);
    
    if (testEmailResult.rowCount > 0) {
      console.log('✅ Added test sent email for UI demonstration');
    }
    
    // Add a test received email 
    const inboundEmailResult = await db.query(`
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
        $1, $2, 'inbound', $3, $4, $5, $6, $7, NOW() - INTERVAL '1 hour', false, NOW()
      )
    `, [
      emailAccount.rows[0].id,
      customer.id,
      customer.email,
      [emailAccount.rows[0].email_address],
      'Re: Welcome to MCM - Additional Questions',
      'Hi MCM Team,\n\nThank you for the quote. I have a few additional questions:\n\n1. What are the delivery timeframes?\n2. Do you offer bulk discounts?\n3. Can you provide technical specifications?\n\nLooking forward to your response.\n\nBest regards,\n' + customer.name,
      '<p>Hi MCM Team,</p><p>Thank you for the quote. I have a few additional questions:</p><ol><li>What are the delivery timeframes?</li><li>Do you offer bulk discounts?</li><li>Can you provide technical specifications?</li></ol><p>Looking forward to your response.</p><p>Best regards,<br/>' + customer.name + '</p>'
    ]);
    
    if (inboundEmailResult.rowCount > 0) {
      console.log('✅ Added test received email for UI demonstration');
    }
    
    console.log('\n📧 Email test data setup complete!');
    console.log(`Customer: ${customer.name} (${customer.email})`);
    console.log('- 1 sent email (2 hours ago)');
    console.log('- 1 unread received email (1 hour ago)');
    console.log('\n🎯 You can now test the improved email UI in the customer panel!');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error setting up test email data:', error.message);
    process.exit(1);
  }
}

addTestEmailIfNeeded();
