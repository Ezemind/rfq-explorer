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
    console.log('🧪 Testing email system...');
    
    // Check email accounts
    const accounts = await db.query('SELECT id, name, email_address, is_active, is_default FROM email_accounts WHERE is_active = true');
    console.log('\n📧 Active Email Accounts:');
    accounts.rows.forEach(acc => {
      console.log(`- ${acc.name} (${acc.email_address}) ${acc.is_default ? '[DEFAULT]' : ''}`);
    });
    
    // Check email templates
    const templates = await db.query('SELECT id, name, template_type, subject FROM email_templates WHERE is_active = true ORDER BY template_type, name');
    console.log('\n📋 Email Templates:');
    templates.rows.forEach(tmpl => {
      console.log(`- [${tmpl.template_type}] ${tmpl.name}: "${tmpl.subject}"`);
    });
    
    // Check recent email messages
    const messages = await db.query(`
      SELECT em.id, em.subject, em.direction, em.sent_at, em.received_at, 
             ea.name as account_name, c.name as customer_name
      FROM email_messages em
      LEFT JOIN email_accounts ea ON em.email_account_id = ea.id
      LEFT JOIN customers c ON em.customer_id = c.id
      ORDER BY COALESCE(em.sent_at, em.received_at) DESC 
      LIMIT 5
    `);
    console.log('\n📨 Recent Email Messages:');
    if (messages.rows.length === 0) {
      console.log('- No email messages found');
    } else {
      messages.rows.forEach(msg => {
        const date = msg.sent_at || msg.received_at;
        console.log(`- [${msg.direction}] "${msg.subject}" (${msg.customer_name || 'Unknown'}) via ${msg.account_name || 'Unknown'} on ${date}`);
      });
    }
    
    // Check if customers have email addresses
    const customerEmails = await db.query(`
      SELECT COUNT(*) as total_customers,
             COUNT(email) as with_email,
             COUNT(email) * 100.0 / COUNT(*) as email_percentage
      FROM customers
    `);
    console.log('\n👥 Customer Email Coverage:');
    const stats = customerEmails.rows[0];
    console.log(`- Total customers: ${stats.total_customers}`);
    console.log(`- With email: ${stats.with_email} (${parseFloat(stats.email_percentage).toFixed(1)}%)`);
    
    await db.end();
    console.log('\n✅ Email system test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing email system:', error.message);
    process.exit(1);
  }
}

testEmailSystem();
