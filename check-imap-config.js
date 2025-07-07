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

async function checkImapConfig() {
  try {
    console.log('🔍 Checking IMAP configuration...');
    
    // Check email accounts
    const accounts = await db.query(`
      SELECT id, name, email_address, is_active, is_default, 
             smtp_host, smtp_port, smtp_user, smtp_password,
             imap_host, imap_port, imap_user, imap_password,
             last_imap_sync
      FROM email_accounts 
      WHERE is_active = true
    `);
    
    console.log('\n📧 Email Account IMAP Settings:');
    accounts.rows.forEach(acc => {
      console.log(`\n--- ${acc.name} (${acc.email_address}) ---`);
      console.log(`SMTP: ${acc.smtp_host}:${acc.smtp_port} (User: ${acc.smtp_user})`);
      console.log(`IMAP: ${acc.imap_host || 'NOT SET'}:${acc.imap_port || 'N/A'} (User: ${acc.imap_user || 'NOT SET'})`);
      console.log(`Last IMAP Sync: ${acc.last_imap_sync || 'Never'}`);
    });
    
    // Check for IMAP-specific configurations
    const imapConfigs = await db.query(`
      SELECT * FROM email_server_configs 
      WHERE config_type = 'imap' OR config_type = 'incoming'
    `);
    
    if (imapConfigs.rows.length > 0) {
      console.log('\n🔧 IMAP Server Configurations:');
      imapConfigs.rows.forEach(config => {
        console.log(`- ${config.config_name}: ${config.config_value}`);
      });
    } else {
      console.log('\n❌ No IMAP server configurations found');
    }
    
    // Check recent email activity
    const recentInbound = await db.query(`
      SELECT COUNT(*) as count, MAX(received_at) as latest_received
      FROM email_messages 
      WHERE direction = 'inbound' 
      AND received_at > NOW() - INTERVAL '24 hours'
    `);
    
    console.log('\n📨 Recent Email Activity (24h):');
    console.log(`Inbound emails: ${recentInbound.rows[0].count}`);
    console.log(`Latest received: ${recentInbound.rows[0].latest_received || 'None'}`);
    
    // Suggest IMAP setup if missing
    const missingImap = accounts.rows.filter(acc => !acc.imap_host);
    if (missingImap.length > 0) {
      console.log('\n⚠️  IMAP Setup Needed:');
      missingImap.forEach(acc => {
        console.log(`- ${acc.name}: Missing IMAP configuration`);
        if (acc.email_address.includes('@mcmco.co.za')) {
          console.log(`  Suggested IMAP settings for ${acc.email_address}:`);
          console.log('  IMAP Host: mail.mcmco.co.za (or your mail server)');
          console.log('  IMAP Port: 993 (SSL) or 143 (STARTTLS)');
          console.log('  Security: SSL/TLS');
        }
      });
    }
    
    await db.end();
    console.log('\n✅ IMAP configuration check completed!');
  } catch (error) {
    console.error('❌ Error checking IMAP config:', error.message);
    process.exit(1);
  }
}

checkImapConfig();
