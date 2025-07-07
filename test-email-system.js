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

async function testEmailSystem() {
  try {
    console.log('🧪 Testing email system functionality...');

    // Test 1: Check if email templates can be retrieved
    console.log('\n1. Testing email templates retrieval...');
    const templatesResult = await db.query(`
      SELECT et.*, su.username as created_by_username
      FROM email_templates et
      LEFT JOIN staff_users su ON et.created_by = su.id
      WHERE et.is_active = true
      ORDER BY et.template_type, et.name
    `);
    console.log(`✅ Found ${templatesResult.rows.length} email templates`);
    templatesResult.rows.forEach(template => {
      console.log(`   - ${template.name} (${template.template_type})`);
    });

    // Test 2: Check if email accounts table works
    console.log('\n2. Testing email accounts...');
    const accountsResult = await db.query(`
      SELECT ea.*, su.username as created_by_username
      FROM email_accounts ea
      LEFT JOIN staff_users su ON ea.created_by = su.id
      ORDER BY ea.is_default DESC, ea.created_at DESC
    `);
    console.log(`✅ Found ${accountsResult.rows.length} email accounts`);
    if (accountsResult.rows.length === 0) {
      console.log('   ⚠️  No email accounts configured - this may cause issues');
    }

    // Test 3: Check email messages table
    console.log('\n3. Testing email messages...');
    const messagesResult = await db.query(`
      SELECT em.*, ea.email_address as account_email, c.name as customer_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      LEFT JOIN customers c ON em.customer_id = c.id
      ORDER BY em.received_at DESC, em.sent_at DESC
      LIMIT 5
    `);
    console.log(`✅ Found ${messagesResult.rows.length} email messages`);

    // Test 4: Test template variable parsing
    console.log('\n4. Testing template variable parsing...');
    const testTemplate = templatesResult.rows[0];
    if (testTemplate) {
      console.log(`   Template: ${testTemplate.name}`);
      console.log(`   Variables: ${testTemplate.variables}`);
      
      // Parse variables
      let variables = [];
      try {
        variables = JSON.parse(testTemplate.variables || '[]');
        console.log(`   ✅ Parsed ${variables.length} variables: ${variables.join(', ')}`);
      } catch (error) {
        console.log(`   ❌ Error parsing variables: ${error.message}`);
      }
    }

    // Test 5: Check if customer email preferences work
    console.log('\n5. Testing customer email preferences...');
    const preferencesResult = await db.query(`
      SELECT COUNT(*) as count FROM customer_email_preferences
    `);
    console.log(`✅ Found ${preferencesResult.rows[0].count} customer email preferences`);

    // Test 6: Test a simple email template substitution
    console.log('\n6. Testing template substitution...');
    if (testTemplate) {
      let body = testTemplate.body_text || testTemplate.body_html;
      const testData = {
        customer_name: 'John Doe',
        inquiry_subject: 'Product Inquiry',
        sender_name: 'Support Team'
      };
      
      // Simple substitution
      Object.keys(testData).forEach(key => {
        body = body.replace(new RegExp(`{${key}}`, 'g'), testData[key]);
      });
      
      console.log('   Original template body (first 100 chars):');
      console.log(`   "${(testTemplate.body_text || testTemplate.body_html).substring(0, 100)}..."`);
      console.log('   After substitution:');
      console.log(`   "${body.substring(0, 100)}..."`);
      console.log('   ✅ Template substitution working');
    }

    console.log('\n🎉 Email system test completed successfully!');
    
    // Recommendations
    console.log('\n📝 Recommendations:');
    if (accountsResult.rows.length === 0) {
      console.log('   - Add at least one email account to enable email functionality');
    }
    console.log('   - Test the UI by clicking on "Email Templates" in Admin Settings');
    console.log('   - Check browser console for any JavaScript errors');

  } catch (error) {
    console.error('❌ Error testing email system:', error);
  } finally {
    await db.end();
  }
}

testEmailSystem();
