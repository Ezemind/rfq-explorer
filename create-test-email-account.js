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

async function createTestEmailAccount() {
  try {
    console.log('📧 Creating test email account...');

    // Create a test email account
    const result = await db.query(`
      INSERT INTO email_accounts (
        name, email_address, smtp_host, smtp_port, smtp_username, smtp_password,
        imap_host, imap_port, imap_username, imap_password, is_default, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 1)
      ON CONFLICT (email_address) DO UPDATE SET
        name = EXCLUDED.name,
        is_default = EXCLUDED.is_default,
        is_active = EXCLUDED.is_active
      RETURNING id
    `, [
      'Test Gmail Account',
      'test@example.com',
      'smtp.gmail.com',
      587,
      'test@example.com',
      'placeholder_password', // In production this should be encrypted
      'imap.gmail.com',
      993,
      'test@example.com',
      'placeholder_password', // In production this should be encrypted
      true // is_default
    ]);

    console.log(`✅ Created/Updated test email account with ID: ${result.rows[0].id}`);

    // Verify the account was created
    const verifyResult = await db.query(`
      SELECT name, email_address, is_default, is_active 
      FROM email_accounts 
      WHERE email_address = 'test@example.com'
    `);

    if (verifyResult.rows.length > 0) {
      const account = verifyResult.rows[0];
      console.log('✅ Account verification:');
      console.log(`  Name: ${account.name}`);
      console.log(`  Email: ${account.email_address}`);
      console.log(`  Default: ${account.is_default}`);
      console.log(`  Active: ${account.is_active}`);
    }

    console.log('\n🎉 Test email account setup completed!');
    console.log('📝 Note: This is a test account with placeholder credentials.');
    console.log('   To use real email functionality, configure with actual SMTP/IMAP settings.');

  } catch (error) {
    console.error('❌ Error creating test email account:', error);
  } finally {
    await db.end();
  }
}

createTestEmailAccount();
