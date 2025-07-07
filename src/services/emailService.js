import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

class EmailService {
  constructor() {
    this.transporters = new Map(); // Cache email transporters
    this.imapConnections = new Map(); // Cache IMAP connections
  }

  // Get or create SMTP transporter for an email account
  async getTransporter(accountId) {
    if (this.transporters.has(accountId)) {
      return this.transporters.get(accountId);
    }

    try {
      const result = await window.electronAPI.query(`
        SELECT * FROM email_accounts WHERE id = $1 AND is_active = true
      `, [accountId]);

      if (!result.success || result.data.length === 0) {
        throw new Error('Email account not found or inactive');
      }

      const account = result.data[0];
      
      const transporter = nodemailer.createTransporter({
        host: account.smtp_host,
        port: account.smtp_port,
        secure: account.smtp_port === 465, // true for 465, false for other ports
        auth: {
          user: account.smtp_username,
          pass: account.smtp_password // In production, decrypt this
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });

      // Verify connection
      await transporter.verify();
      
      this.transporters.set(accountId, transporter);
      return transporter;
    } catch (error) {
      console.error('Error creating email transporter:', error);
      throw error;
    }
  }

  // Send email
  async sendEmail(accountId, emailData) {
    try {
      const transporter = await this.getTransporter(accountId);
      
      const mailOptions = {
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments
      };

      const info = await transporter.sendMail(mailOptions);
      
      // Store in database
      await this.storeEmailMessage({
        email_account_id: accountId,
        direction: 'outbound',
        message_id: info.messageId,
        from_email: emailData.from,
        to_emails: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        cc_emails: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc]) : [],
        bcc_emails: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc]) : [],
        subject: emailData.subject,
        body_html: emailData.html,
        body_text: emailData.text,
        sent_at: new Date()
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Store email message in database
  async storeEmailMessage(messageData) {
    try {
      const result = await window.electronAPI.query(`
        INSERT INTO email_messages (
          email_account_id, direction, message_id, from_email, to_emails, cc_emails, bcc_emails,
          subject, body_html, body_text, sent_at, received_at, customer_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        messageData.email_account_id,
        messageData.direction,
        messageData.message_id,
        messageData.from_email,
        messageData.to_emails,
        messageData.cc_emails || [],
        messageData.bcc_emails || [],
        messageData.subject,
        messageData.body_html,
        messageData.body_text,
        messageData.sent_at,
        messageData.received_at,
        messageData.customer_id
      ]);

      return result.data[0].id;
    } catch (error) {
      console.error('Error storing email message:', error);
      throw error;
    }
  }

  // Get IMAP connection for an account
  async getImapConnection(accountId) {
    if (this.imapConnections.has(accountId)) {
      return this.imapConnections.get(accountId);
    }

    try {
      const result = await window.electronAPI.query(`
        SELECT * FROM email_accounts WHERE id = $1 AND is_active = true
      `, [accountId]);

      if (!result.success || result.data.length === 0) {
        throw new Error('Email account not found or inactive');
      }

      const account = result.data[0];
      
      const client = new ImapFlow({
        host: account.imap_host,
        port: account.imap_port,
        secure: account.imap_port === 993,
        auth: {
          user: account.imap_username,
          pass: account.imap_password // In production, decrypt this
        },
        logger: false // Set to console for debugging
      });

      await client.connect();
      
      this.imapConnections.set(accountId, client);
      return client;
    } catch (error) {
      console.error('Error creating IMAP connection:', error);
      throw error;
    }
  }

  // Fetch new emails from IMAP
  async fetchNewEmails(accountId) {
    try {
      const client = await this.getImapConnection(accountId);
      
      // Select INBOX
      let lock = await client.getMailboxLock('INBOX');
      
      try {
        // Get the last processed email UID for this account
        const lastProcessedResult = await window.electronAPI.query(`
          SELECT MAX(CAST(metadata->>'imap_uid' AS INTEGER)) as last_uid
          FROM email_messages 
          WHERE email_account_id = $1 AND direction = 'inbound'
        `, [accountId]);
        
        const lastUid = lastProcessedResult.data[0]?.last_uid || 0;
        
        // Fetch messages with UID greater than last processed
        const messages = [];
        for await (let message of client.fetch(`${lastUid + 1}:*`, {
          envelope: true,
          bodyStructure: true,
          source: true,
          uid: true
        })) {
          messages.push(message);
        }
        
        // Process each new message
        for (const message of messages) {
          await this.processIncomingEmail(accountId, message);
        }
        
        return {
          success: true,
          newMessages: messages.length
        };
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process incoming email and store in database
  async processIncomingEmail(accountId, imapMessage) {
    try {
      const envelope = imapMessage.envelope;
      const source = imapMessage.source.toString();
      
      // Extract customer information
      const fromEmail = envelope.from[0]?.address;
      const customerId = await this.findOrCreateCustomer(fromEmail, envelope.from[0]?.name);
      
      // Parse email body (simplified - in production, use a proper email parser)
      const bodyText = this.extractTextFromEmail(source);
      const bodyHtml = this.extractHtmlFromEmail(source);
      
      // Detect RFQ references and products
      const rfqReferences = this.detectRFQReferences(bodyText);
      const productMentions = this.detectProductMentions(bodyText);
      
      // Store email in database
      const emailId = await this.storeEmailMessage({
        email_account_id: accountId,
        customer_id: customerId,
        direction: 'inbound',
        message_id: envelope.messageId,
        from_email: fromEmail,
        to_emails: envelope.to?.map(addr => addr.address) || [],
        cc_emails: envelope.cc?.map(addr => addr.address) || [],
        subject: envelope.subject,
        body_html: bodyHtml,
        body_text: bodyText,
        received_at: envelope.date,
        metadata: {
          imap_uid: imapMessage.uid,
          envelope: envelope
        }
      });
      
      // Link to RFQs if detected
      for (const rfqId of rfqReferences) {
        await this.linkEmailToRFQ(emailId, rfqId, 'response', true);
      }
      
      // Store product mentions
      for (const product of productMentions) {
        await this.storeProductMention(emailId, product);
      }
      
      console.log(`✅ Processed incoming email: ${envelope.subject}`);
      
    } catch (error) {
      console.error('Error processing incoming email:', error);
    }
  }

  // Find or create customer based on email address
  async findOrCreateCustomer(email, name) {
    try {
      // First, try to find existing customer
      const existingResult = await window.electronAPI.query(`
        SELECT id FROM customers WHERE email = $1 OR phone = $2
      `, [email, email]); // In case email is stored in phone field

      if (existingResult.success && existingResult.data.length > 0) {
        return existingResult.data[0].id;
      }

      // Create new customer
      const createResult = await window.electronAPI.query(`
        INSERT INTO customers (name, email, created_at, source)
        VALUES ($1, $2, NOW(), 'email')
        RETURNING id
      `, [name || email.split('@')[0], email]);

      return createResult.data[0].id;
    } catch (error) {
      console.error('Error finding/creating customer:', error);
      return null;
    }
  }

  // Detect RFQ references in email content
  detectRFQReferences(text) {
    const rfqIds = [];
    
    // Look for patterns like "RFQ #123", "Order #456", "Quote 789"
    const patterns = [
      /(?:RFQ|ORDER|QUOTE|REF)\s*#?\s*(\d+)/gi,
      /(?:reference|ref)\s*:?\s*(\d+)/gi
    ];
    
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const id = parseInt(match[1]);
        if (id && !rfqIds.includes(id)) {
          rfqIds.push(id);
        }
      }
    }
    
    return rfqIds;
  }

  // Detect product mentions in email content
  detectProductMentions(text) {
    const products = [];
    
    // Simple product detection - in production, use more sophisticated NLP
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for patterns like "Product ABC - 5 units - $100"
      const productMatch = line.match(/(.+?)\s*-\s*(\d+)\s*(?:units?|pcs?|pieces?)?\s*-\s*\$?(\d+(?:\.\d{2})?)/i);
      
      if (productMatch) {
        products.push({
          product_name: productMatch[1].trim(),
          quantity: parseInt(productMatch[2]),
          price: parseFloat(productMatch[3]),
          context_text: line.trim(),
          confidence_score: 0.8
        });
      }
    }
    
    return products;
  }

  // Link email to RFQ request
  async linkEmailToRFQ(emailId, rfqId, relationshipType = 'response', autoDetected = true) {
    try {
      await window.electronAPI.query(`
        INSERT INTO email_rfq_links (email_message_id, rfq_request_id, relationship_type, auto_detected)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [emailId, rfqId, relationshipType, autoDetected]);
    } catch (error) {
      console.error('Error linking email to RFQ:', error);
    }
  }

  // Store product mention
  async storeProductMention(emailId, product) {
    try {
      await window.electronAPI.query(`
        INSERT INTO email_product_mentions (
          email_message_id, product_name, quantity, price, 
          confidence_score, context_text
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        emailId,
        product.product_name,
        product.quantity,
        product.price,
        product.confidence_score,
        product.context_text
      ]);
    } catch (error) {
      console.error('Error storing product mention:', error);
    }
  }

  // Schedule follow-up emails
  async scheduleFollowUpEmail(customerId, templateId, daysFromNow, triggerData = {}) {
    try {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + daysFromNow);
      
      // Get default email account
      const accountResult = await window.electronAPI.query(`
        SELECT id FROM email_accounts WHERE is_default = true AND is_active = true LIMIT 1
      `);
      
      if (!accountResult.success || accountResult.data.length === 0) {
        throw new Error('No default email account found');
      }
      
      const result = await window.electronAPI.query(`
        INSERT INTO email_campaigns (
          name, template_id, email_account_id, customer_id, trigger_type,
          trigger_data, scheduled_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      `, [
        `${daysFromNow}-day follow-up`,
        templateId,
        accountResult.data[0].id,
        customerId,
        `followup_${daysFromNow}day`,
        JSON.stringify(triggerData),
        scheduledAt
      ]);
      
      return result.success;
    } catch (error) {
      console.error('Error scheduling follow-up email:', error);
      return false;
    }
  }

  // Process scheduled emails
  async processScheduledEmails() {
    try {
      const result = await window.electronAPI.query(`
        SELECT ec.*, et.subject, et.body_html, et.body_text, et.variables,
               ea.email_address as from_email, c.email as to_email, c.name as customer_name
        FROM email_campaigns ec
        JOIN email_templates et ON ec.template_id = et.id
        JOIN email_accounts ea ON ec.email_account_id = ea.id
        JOIN customers c ON ec.customer_id = c.id
        WHERE ec.status = 'pending' 
        AND ec.scheduled_at <= NOW()
        AND ea.is_active = true
      `);
      
      if (!result.success) return;
      
      for (const campaign of result.data) {
        await this.sendScheduledEmail(campaign);
      }
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
    }
  }

  // Send scheduled email
  async sendScheduledEmail(campaign) {
    try {
      // Replace template variables
      const subject = this.replaceTemplateVariables(campaign.subject, campaign);
      const bodyHtml = this.replaceTemplateVariables(campaign.body_html, campaign);
      const bodyText = this.replaceTemplateVariables(campaign.body_text, campaign);
      
      const emailData = {
        from: campaign.from_email,
        to: campaign.to_email,
        subject: subject,
        html: bodyHtml,
        text: bodyText
      };
      
      const sendResult = await this.sendEmail(campaign.email_account_id, emailData);
      
      // Update campaign status
      await window.electronAPI.query(`
        UPDATE email_campaigns 
        SET status = $1, sent_at = NOW(), error_message = $2
        WHERE id = $3
      `, [
        sendResult.success ? 'sent' : 'failed',
        sendResult.success ? null : sendResult.error,
        campaign.id
      ]);
      
      console.log(`📧 Scheduled email ${sendResult.success ? 'sent' : 'failed'}: ${campaign.name}`);
      
    } catch (error) {
      console.error('Error sending scheduled email:', error);
      
      // Mark as failed
      await window.electronAPI.query(`
        UPDATE email_campaigns 
        SET status = 'failed', error_message = $1
        WHERE id = $2
      `, [error.message, campaign.id]);
    }
  }

  // Replace template variables with actual values
  replaceTemplateVariables(text, data) {
    if (!text) return '';
    
    const variables = {
      '{customer_name}': data.customer_name || 'Valued Customer',
      '{company_name}': 'Bob Explorer',
      '{sender_name}': 'Bob Explorer Team',
      '{date}': new Date().toLocaleDateString(),
      '{inquiry_subject}': data.trigger_data?.subject || 'your inquiry',
      '{order_id}': data.trigger_data?.order_id || '',
      '{product_list}': data.trigger_data?.product_list || '',
      '{total_amount}': data.trigger_data?.total_amount || ''
    };
    
    let result = text;
    for (const [variable, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  // Extract text content from email source
  extractTextFromEmail(source) {
    // Simplified extraction - in production, use a proper email parser
    const textMatch = source.match(/Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type|\n\.\n|$)/i);
    return textMatch ? textMatch[1].trim() : '';
  }

  // Extract HTML content from email source  
  extractHtmlFromEmail(source) {
    // Simplified extraction - in production, use a proper email parser
    const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type|\n\.\n|$)/i);
    return htmlMatch ? htmlMatch[1].trim() : '';
  }

  // Clean up connections
  async cleanup() {
    for (const [accountId, connection] of this.imapConnections) {
      try {
        await connection.logout();
      } catch (error) {
        console.error(`Error closing IMAP connection for account ${accountId}:`, error);
      }
    }
    this.imapConnections.clear();
    this.transporters.clear();
  }
}

export default new EmailService();
