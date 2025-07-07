const { Pool } = require('pg');
const Imap = require('imap');

const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
};

const db = new Pool(dbConfig);

async function syncEmailsFromImap() {
  try {
    console.log('📧 Starting IMAP sync for bob@mcmco.co.za...');
    
    // Get bob's email account settings
    const bobAccount = await db.query(`
      SELECT * FROM email_accounts 
      WHERE email_address = 'bob@mcmco.co.za' 
      AND is_active = true
      LIMIT 1
    `);
    
    if (bobAccount.rows.length === 0) {
      console.log('❌ Bob email account not found');
      await db.end();
      return;
    }
    
    const account = bobAccount.rows[0];
    console.log(`✅ Found account: ${account.email_address}`);
    console.log(`📡 IMAP Server: ${account.imap_host}:${account.imap_port}`);
    
    // Create IMAP connection
    const imap = new Imap({
      user: account.imap_username,
      password: account.imap_password,
      host: account.imap_host,
      port: account.imap_port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 30000,
      connTimeout: 30000
    });
    
    let newEmailsFound = 0;
    
    imap.once('ready', async function() {
      console.log('✅ IMAP connection established');
      
      imap.openBox('INBOX', false, function(err, box) {
        if (err) {
          console.error('❌ Error opening inbox:', err.message);
          imap.end();
          return;
        }
        
        console.log(`📬 Inbox opened - ${box.messages.total} total messages`);
        
        // Search for recent emails (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        imap.search(['UNSEEN'], function(err, results) {
          if (err) {
            console.error('❌ Error searching emails:', err.message);
            imap.end();
            return;
          }
          
          if (!results || results.length === 0) {
            console.log('📭 No unread emails found');
            imap.end();
            return;
          }
          
          console.log(`📧 Found ${results.length} unread emails`);
          
          const fetch = imap.fetch(results, {
            bodies: '',
            markSeen: false
          });
          
          fetch.on('message', function(msg, seqno) {
            console.log(`📩 Processing email ${seqno}...`);
            
            let emailData = {
              headers: {},
              body: ''
            };
            
            msg.on('body', function(stream, info) {
              let buffer = '';
              stream.on('data', function(chunk) {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', function() {
                emailData.body = buffer;
              });
            });
            
            msg.once('attributes', function(attrs) {
              emailData.attrs = attrs;
            });
            
            msg.once('end', function() {
              console.log(`✅ Email ${seqno} received, processing...`);
              processEmail(emailData, account.id).then(() => {
                newEmailsFound++;
              }).catch(console.error);
            });
          });
          
          fetch.once('error', function(err) {
            console.error('❌ Fetch error:', err.message);
          });
          
          fetch.once('end', function() {
            console.log('✅ IMAP fetch completed');
            imap.end();
          });
        });
      });
    });
    
    imap.once('error', function(err) {
      console.error('❌ IMAP connection error:', err.message);
      console.error('💡 This might be due to:');
      console.error('   - Incorrect IMAP credentials');
      console.error('   - Server firewall blocking connection');
      console.error('   - IMAP not enabled on server');
    });
    
    imap.once('end', function() {
      console.log('📧 IMAP connection closed');
      console.log(`📊 Summary: ${newEmailsFound} new emails processed`);
    });
    
    console.log('🔗 Connecting to IMAP server...');
    imap.connect();
    
  } catch (error) {
    console.error('❌ IMAP sync error:', error.message);
  }
}

async function processEmail(emailData, accountId) {
  try {
    // Simple email parsing (in production, use a proper email parser)
    const lines = emailData.body.split('\n');
    let fromEmail = '', subject = '', bodyText = '';
    
    for (const line of lines) {
      if (line.toLowerCase().startsWith('from:')) {
        fromEmail = line.substring(5).trim();
      } else if (line.toLowerCase().startsWith('subject:')) {
        subject = line.substring(8).trim();
      }
    }
    
    bodyText = emailData.body;
    
    console.log(`📧 Processing email from: ${fromEmail}, subject: "${subject}"`);
    
    // Try to find matching customer
    const customer = await db.query(`
      SELECT id, name, email FROM customers WHERE email = $1 LIMIT 1
    `, [fromEmail]);
    
    let customerId = null;
    if (customer.rows.length > 0) {
      customerId = customer.rows[0].id;
      console.log(`🎯 Matched customer: ${customer.rows[0].name}`);
    } else {
      console.log(`❓ No customer found for: ${fromEmail}`);
    }
    
    // Insert email into database
    const insertResult = await db.query(`
      INSERT INTO email_messages (
        email_account_id, customer_id, direction, from_email, to_emails,
        subject, body_text, received_at, is_read, created_at
      ) VALUES ($1, $2, 'inbound', $3, $4, $5, $6, NOW(), false, NOW())
      RETURNING id
    `, [
      accountId, customerId, fromEmail, ['bob@mcmco.co.za'],
      subject, bodyText
    ]);
    
    if (insertResult.rowCount > 0) {
      console.log(`✅ Email saved with ID: ${insertResult.rows[0].id}`);
    }
    
  } catch (error) {
    console.error('❌ Error processing email:', error.message);
  }
}

// Check if imap module is available
try {
  require.resolve('imap');
  syncEmailsFromImap();
} catch (e) {
  console.log('❌ IMAP module not installed');
  console.log('💡 To enable real IMAP sync, install: npm install imap');
  console.log('📧 For now, using simulated email detection...');
  
  // Fallback: just check for recent activity
  setTimeout(async () => {
    try {
      const recentCheck = await db.query(`
        SELECT COUNT(*) as count FROM email_messages 
        WHERE received_at > NOW() - INTERVAL '10 minutes'
      `);
      console.log(`📧 Recent email activity: ${recentCheck.rows[0].count} emails in last 10 minutes`);
      await db.end();
    } catch (error) {
      console.error('Error:', error.message);
    }
  }, 1000);
}
