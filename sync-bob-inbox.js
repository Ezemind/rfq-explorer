const { Pool } = require('pg');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
};

const db = new Pool(dbConfig);

async function syncBobInbox() {
  try {
    console.log('📧 Starting IMAP sync for bob@mcmco.co.za inbox...');
    
    // Get bob's IMAP settings
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
    console.log(`✅ Connecting to: ${account.imap_host}:${account.imap_port}`);
    console.log(`📧 Account: ${account.email_address}`);
    
    // Create IMAP connection
    const imap = new Imap({
      user: account.imap_username,
      password: account.imap_password,
      host: account.imap_host,
      port: account.imap_port,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: account.imap_host
      },
      authTimeout: 30000,
      connTimeout: 30000,
      keepalive: false
    });
    
    let processedEmails = 0;
    
    imap.once('ready', function() {
      console.log('✅ IMAP connection established');
      
      imap.openBox('INBOX', false, function(err, box) {
        if (err) {
          console.error('❌ Error opening inbox:', err.message);
          imap.end();
          return;
        }
        
        console.log(`📬 Inbox opened - ${box.messages.total} total messages`);
        
        // Search for recent emails (let's just get unread emails for now)
        console.log(`🔍 Searching for unread emails...`);
        
        imap.search(['UNSEEN'], function(err, results) {
          if (err) {
            console.error('❌ Error searching emails:', err.message);
            imap.end();
            return;
          }
          
          if (!results || results.length === 0) {
            console.log('📭 No recent emails found');
            imap.end();
            return;
          }
          
          console.log(`📧 Found ${results.length} recent emails to process`);
          
          const fetch = imap.fetch(results, {
            bodies: '',
            markSeen: false,
            struct: true
          });
          
          fetch.on('message', function(msg, seqno) {
            console.log(`📩 Processing email ${seqno}...`);
            
            let emailBuffer = '';
            
            msg.on('body', function(stream, info) {
              stream.on('data', function(chunk) {
                emailBuffer += chunk.toString('utf8');
              });
              
              stream.once('end', function() {
                // Parse email with mailparser
                simpleParser(emailBuffer, async (err, parsed) => {
                  if (err) {
                    console.error(`❌ Error parsing email ${seqno}:`, err.message);
                    return;
                  }
                  
                  try {
                    await processEmail(parsed, account.id);
                    processedEmails++;
                  } catch (processError) {
                    console.error(`❌ Error processing email ${seqno}:`, processError.message);
                  }
                });
              });
            });
          });
          
          fetch.once('error', function(err) {
            console.error('❌ Fetch error:', err.message);
          });
          
          fetch.once('end', function() {
            console.log(`✅ IMAP fetch completed - processed ${processedEmails} emails`);
            imap.end();
          });
        });
      });
    });
    
    imap.once('error', function(err) {
      console.error('❌ IMAP connection error:', err.message);
      console.error('💡 This might be due to:');
      console.error('   - Server refusing connection');
      console.error('   - Incorrect credentials');
      console.error('   - Firewall blocking IMAP port 993');
      console.error('   - Server requiring specific authentication');
    });
    
    imap.once('end', function() {
      console.log('📧 IMAP connection closed');
      console.log(`📊 Total emails processed: ${processedEmails}`);
    });
    
    console.log('🔗 Connecting to IMAP server...');
    imap.connect();
    
  } catch (error) {
    console.error('❌ IMAP sync error:', error.message);
    await db.end();
  }
}

async function processEmail(parsed, accountId) {
  try {
    const fromEmail = parsed.from?.value?.[0]?.address || parsed.from?.text || '';
    const toEmails = parsed.to?.value?.map(addr => addr.address) || [parsed.to?.text] || [];
    const subject = parsed.subject || '';
    const bodyText = parsed.text || '';
    const bodyHtml = parsed.html || parsed.textAsHtml || '';
    const receivedDate = parsed.date || new Date();
    
    console.log(`📧 Processing email:`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${toEmails.join(', ')}`);
    console.log(`   Subject: "${subject}"`);
    console.log(`   Date: ${receivedDate}`);
    
    // Check if this email already exists
    const existingEmail = await db.query(`
      SELECT id FROM email_messages 
      WHERE from_email = $1 
      AND subject = $2 
      AND received_at = $3
      LIMIT 1
    `, [fromEmail, subject, receivedDate]);
    
    if (existingEmail.rows.length > 0) {
      console.log(`   ⏭️ Email already exists (ID: ${existingEmail.rows[0].id})`);
      return;
    }
    
    // Try to find matching customer
    let customerId = null;
    const customer = await db.query(`
      SELECT id, name, email FROM customers WHERE email = $1 LIMIT 1
    `, [fromEmail]);
    
    if (customer.rows.length > 0) {
      customerId = customer.rows[0].id;
      console.log(`   🎯 Matched customer: ${customer.rows[0].name} (ID: ${customerId})`);
    } else {
      console.log(`   ❓ No customer found for: ${fromEmail}`);
    }
    
    // Insert email into database
    const insertResult = await db.query(`
      INSERT INTO email_messages (
        email_account_id, customer_id, direction, from_email, to_emails,
        subject, body_text, body_html, received_at, is_read, created_at
      ) VALUES ($1, $2, 'inbound', $3, $4, $5, $6, $7, $8, false, NOW())
      RETURNING id
    `, [
      accountId, customerId, fromEmail, toEmails,
      subject, bodyText, bodyHtml, receivedDate
    ]);
    
    if (insertResult.rowCount > 0) {
      console.log(`   ✅ Email saved with ID: ${insertResult.rows[0].id}`);
      
      if (customerId) {
        console.log(`   📧 Email linked to customer and will appear in customer panel`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing email:', error.message);
  }
}

// Check if required modules are available
try {
  require.resolve('mailparser');
  syncBobInbox();
} catch (e) {
  console.log('❌ mailparser module not installed');
  console.log('💡 Installing mailparser for email parsing...');
  
  const { exec } = require('child_process');
  exec('npm install mailparser', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to install mailparser:', error.message);
      console.log('📝 Manual installation required:');
      console.log('   npm install mailparser');
      return;
    }
    console.log('✅ mailparser installed, please run this script again');
  });
}
