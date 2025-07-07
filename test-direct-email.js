const nodemailer = require('nodemailer');
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

async function testEmailSending() {
  try {
    console.log('🧪 Testing email sending functionality...');
    
    // Get the email account
    const accountResult = await db.query(`
      SELECT * FROM email_accounts WHERE email_address = 'bob@mcmco.co.za'
    `);
    
    if (accountResult.rows.length === 0) {
      console.log('❌ Email account not found');
      return;
    }
    
    const account = accountResult.rows[0];
    console.log('📧 Using account:', account.email_address);
    
    // Create transporter
    console.log('🔧 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: account.smtp_username,
        pass: account.smtp_password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection
    console.log('🔍 Testing SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ SMTP connection successful!');
    } catch (error) {
      console.log('❌ SMTP connection failed:', error.message);
      console.log('💡 This explains why emails aren\'t being delivered');
      await db.end();
      return;
    }
    
    // Send test email
    console.log('📤 Sending test email...');
    const mailOptions = {
      from: account.email_address,
      to: 'pieter@k-designs.co.za',
      subject: 'Test Email from Bob3 System',
      text: 'This is a test email sent directly from the Bob3 email system to verify SMTP functionality.',
      html: '<p>This is a <strong>test email</strong> sent directly from the Bob3 email system to verify SMTP functionality.</p>'
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
      
      // Save to database
      await db.query(`
        INSERT INTO email_messages (
          email_account_id, direction, from_email, to_emails, subject, body_html, body_text, sent_at
        ) VALUES ($1, 'outbound', $2, $3, $4, $5, $6, NOW())
      `, [
        account.id,
        account.email_address,
        ['pieter@k-designs.co.za'],
        mailOptions.subject,
        mailOptions.html,
        mailOptions.text
      ]);
      
      console.log('✅ Email also saved to database');
      
    } catch (error) {
      console.log('❌ Failed to send email:', error.message);
      console.log('Error details:', error);
    }
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailSending();
