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

async function checkAccountCredentials() {
  try {
    const result = await db.query(`SELECT * FROM email_accounts WHERE email_address = 'bob@mcmco.co.za'`);
    
    if (result.rows.length > 0) {
      const account = result.rows[0];
      console.log('📧 Email Account Details:');
      console.log('Name:', account.name);
      console.log('Email:', account.email_address);
      console.log('SMTP Host:', account.smtp_host);
      console.log('SMTP Port:', account.smtp_port);
      console.log('SMTP Username:', account.smtp_username);
      console.log('SMTP Password:', account.smtp_password ? 'SET' : 'NOT SET');
      console.log('Active:', account.is_active);
      console.log('Default:', account.is_default);

      // Check if credentials look valid
      console.log('\n🔍 Credential Analysis:');
      if (account.smtp_password === 'placeholder_password') {
        console.log('❌ SMTP password is placeholder - emails won\'t actually send');
        console.log('💡 Need to update with real email credentials');
      } else {
        console.log('✅ SMTP password appears to be configured');
      }

      if (!account.smtp_host || account.smtp_host.includes('placeholder')) {
        console.log('❌ SMTP host needs to be configured');
      } else {
        console.log('✅ SMTP host configured:', account.smtp_host);
      }
    } else {
      console.log('❌ Account not found');
    }
    
    await db.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAccountCredentials();
