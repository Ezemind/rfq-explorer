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

async function linkUnlinkedEmails() {
  try {
    console.log('🔗 Linking unlinked emails to customers...');
    
    // First, let's see the Pieter Kemp customer details
    const pieterCustomer = await db.query(`
      SELECT id, name, email, phone 
      FROM customers 
      WHERE email = 'pieter@mcmco.co.za'
      LIMIT 1
    `);
    
    if (pieterCustomer.rows.length === 0) {
      console.log('❌ Pieter Kemp customer not found');
      await db.end();
      return;
    }
    
    const pieter = pieterCustomer.rows[0];
    console.log(`✅ Found customer: ${pieter.name} (${pieter.email}) - ID: ${pieter.id}`);
    
    // Find unlinked emails that should belong to Pieter
    const unllinkedPieterEmails = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, 
             received_at, sent_at, customer_id
      FROM email_messages
      WHERE customer_id IS NULL
      AND (
        from_email = 'pieter@mcmco.co.za' OR 
        to_emails::text LIKE '%pieter@mcmco.co.za%'
      )
      ORDER BY COALESCE(received_at, sent_at) DESC
    `);
    
    console.log(`\n📧 Found ${unllinkedPieterEmails.rows.length} unlinked emails for Pieter:`);
    
    let linkedCount = 0;
    
    for (const email of unllinkedPieterEmails.rows) {
      console.log(`\n${linkedCount + 1}. [${email.direction}] "${email.subject}"`);
      console.log(`   From: ${email.from_email}`);
      console.log(`   To: ${email.to_emails}`);
      console.log(`   Time: ${email.received_at || email.sent_at}`);
      
      // Link this email to Pieter
      const updateResult = await db.query(`
        UPDATE email_messages 
        SET customer_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [pieter.id, email.id]);
      
      if (updateResult.rowCount > 0) {
        console.log(`   ✅ Linked email ${email.id} to ${pieter.name}`);
        linkedCount++;
      } else {
        console.log(`   ❌ Failed to link email ${email.id}`);
      }
    }
    
    // Also check for recent replies that might have come from your Outlook
    const recentUnlinked = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, 
             received_at, sent_at, customer_id, body_text
      FROM email_messages
      WHERE customer_id IS NULL
      AND received_at > NOW() - INTERVAL '6 hours'
      ORDER BY received_at DESC
    `);
    
    console.log(`\n🕒 Recent unlinked emails (last 6 hours):`);
    if (recentUnlinked.rows.length === 0) {
      console.log('✅ No recent unlinked emails found');
    } else {
      for (const email of recentUnlinked.rows) {
        console.log(`\n- [${email.direction}] "${email.subject}"`);
        console.log(`  From: ${email.from_email}`);
        console.log(`  To: ${email.to_emails}`);
        console.log(`  Time: ${email.received_at || email.sent_at}`);
        console.log(`  Preview: ${email.body_text?.substring(0, 100)}...`);
        
        // If this looks like it could be from/to Pieter, link it
        if (email.from_email?.includes('pieter') || 
            email.to_emails?.includes('pieter') ||
            email.subject?.toLowerCase().includes('pieter')) {
          
          const linkResult = await db.query(`
            UPDATE email_messages 
            SET customer_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [pieter.id, email.id]);
          
          if (linkResult.rowCount > 0) {
            console.log(`  ✅ Auto-linked to ${pieter.name}`);
            linkedCount++;
          }
        }
      }
    }
    
    // Now check Pieter's complete email history
    const pieterEmails = await db.query(`
      SELECT id, direction, from_email, to_emails, subject, 
             received_at, sent_at, is_read
      FROM email_messages
      WHERE customer_id = $1
      ORDER BY COALESCE(received_at, sent_at) DESC
      LIMIT 10
    `, [pieter.id]);
    
    console.log(`\n📬 Pieter's complete email history (${pieterEmails.rows.length} emails):`);
    pieterEmails.rows.forEach((email, index) => {
      const isRecent = new Date(email.received_at || email.sent_at) > new Date(Date.now() - 2 * 60 * 60 * 1000);
      console.log(`${index + 1}. [${email.direction}] "${email.subject}" ${isRecent ? '🆕' : ''}`);
      console.log(`   From: ${email.from_email} → To: ${email.to_emails}`);
      console.log(`   Time: ${email.received_at || email.sent_at} ${!email.is_read && email.direction === 'inbound' ? '🔴 UNREAD' : ''}`);
    });
    
    await db.end();
    console.log(`\n✅ Email linking completed! Linked ${linkedCount} emails to customers.`);
    console.log('\n🔄 Try refreshing the email panel now to see updated emails!');
  } catch (error) {
    console.error('❌ Error linking emails:', error.message);
    process.exit(1);
  }
}

linkUnlinkedEmails();
