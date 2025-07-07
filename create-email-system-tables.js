const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: {
    rejectUnauthorized: false
  }
};

const db = new Pool(dbConfig);

async function createEmailSystemTables() {
  console.log('🗄️ Creating email system database tables...');
  
  try {
    // 1. Email accounts table (for connecting email addresses)
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email_address VARCHAR(255) UNIQUE NOT NULL,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_username VARCHAR(255) NOT NULL,
        smtp_password TEXT NOT NULL, -- Encrypted
        imap_host VARCHAR(255) NOT NULL,
        imap_port INTEGER NOT NULL,
        imap_username VARCHAR(255) NOT NULL,
        imap_password TEXT NOT NULL, -- Encrypted
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES staff_users(id)
      );
    `);
    console.log('✅ Created email_accounts table');

    // 2. Email templates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        body_text TEXT,
        template_type VARCHAR(50) DEFAULT 'general', -- general, followup, rfq_response, etc
        variables JSONB DEFAULT '[]', -- Array of template variables like ["{customer_name}", "{order_id}"]
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES staff_users(id),
        updated_by INTEGER REFERENCES staff_users(id)
      );
    `);
    console.log('✅ Created email_templates table');

    // 3. Email campaigns/scheduled emails table
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        template_id INTEGER REFERENCES email_templates(id),
        email_account_id INTEGER REFERENCES email_accounts(id),
        customer_id INTEGER REFERENCES customers(id),
        trigger_type VARCHAR(50) NOT NULL, -- 'manual', 'followup_3day', 'followup_7day', 'followup_14day', 'rfq_response'
        trigger_data JSONB, -- Additional data like RFQ ID, order ID, etc
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP NULL,
        status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, cancelled
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES staff_users(id)
      );
    `);
    console.log('✅ Created email_campaigns table');

    // 4. Email messages table (sent and received emails)
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_messages (
        id SERIAL PRIMARY KEY,
        email_account_id INTEGER REFERENCES email_accounts(id),
        customer_id INTEGER REFERENCES customers(id),
        campaign_id INTEGER REFERENCES email_campaigns(id) NULL,
        message_id VARCHAR(255) UNIQUE, -- Email message ID from server
        thread_id VARCHAR(255), -- For email threading
        direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
        from_email VARCHAR(255) NOT NULL,
        to_emails TEXT[] NOT NULL,
        cc_emails TEXT[],
        bcc_emails TEXT[],
        subject VARCHAR(500),
        body_html TEXT,
        body_text TEXT,
        attachments JSONB DEFAULT '[]', -- Array of attachment info
        is_read BOOLEAN DEFAULT false,
        is_replied BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high
        tags TEXT[],
        metadata JSONB DEFAULT '{}', -- Store extracted order IDs, product references, etc
        received_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created email_messages table');

    // 5. Email-RFQ relationships table (for linking emails to RFQ requests)
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_rfq_links (
        id SERIAL PRIMARY KEY,
        email_message_id INTEGER REFERENCES email_messages(id),
        rfq_request_id INTEGER REFERENCES rfq_requests(id),
        relationship_type VARCHAR(50), -- 'response', 'followup', 'query'
        auto_detected BOOLEAN DEFAULT false, -- Whether link was auto-detected
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES staff_users(id)
      );
    `);
    console.log('✅ Created email_rfq_links table');

    // 6. Email product mentions table (for auto-detecting products in emails)
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_product_mentions (
        id SERIAL PRIMARY KEY,
        email_message_id INTEGER REFERENCES email_messages(id),
        product_name VARCHAR(255),
        product_code VARCHAR(100),
        quantity INTEGER,
        price DECIMAL(10,2),
        confidence_score DECIMAL(3,2), -- 0.00 to 1.00 for auto-detection confidence
        context_text TEXT, -- The text around the product mention
        verified BOOLEAN DEFAULT false, -- Staff verified this detection
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created email_product_mentions table');

    // 7. Email automation rules table
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_automation_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trigger_type VARCHAR(100) NOT NULL, -- 'customer_created', 'rfq_submitted', 'days_after_rfq', etc
        conditions JSONB NOT NULL, -- Conditions for when rule applies
        action_type VARCHAR(100) NOT NULL, -- 'send_template', 'create_followup', etc
        action_data JSONB NOT NULL, -- Template ID, delay days, etc
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES staff_users(id)
      );
    `);
    console.log('✅ Created email_automation_rules table');

    // Create indexes for performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_messages_customer ON email_messages(customer_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_messages_direction ON email_messages(direction);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_messages_received ON email_messages(received_at);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_at);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_rfq_links_rfq ON email_rfq_links(rfq_request_id);');
    
    console.log('✅ Created all indexes');

    // Insert default email templates
    await db.query(`
      INSERT INTO email_templates (name, subject, body_html, body_text, template_type, variables, created_by)
      VALUES 
      (
        '3-Day Follow-up',
        'Following up on your recent inquiry - {customer_name}',
        '<p>Hi {customer_name},</p><p>I wanted to follow up on your recent inquiry regarding {inquiry_subject}.</p><p>If you have any questions or need additional information, please don''t hesitate to reach out.</p><p>Best regards,<br>{sender_name}</p>',
        'Hi {customer_name},\n\nI wanted to follow up on your recent inquiry regarding {inquiry_subject}.\n\nIf you have any questions or need additional information, please don''t hesitate to reach out.\n\nBest regards,\n{sender_name}',
        'followup',
        '["customer_name", "inquiry_subject", "sender_name"]',
        1
      ),
      (
        '7-Day Follow-up',
        'Checking in - {customer_name}',
        '<p>Hello {customer_name},</p><p>It''s been a week since your inquiry about {inquiry_subject}. I wanted to check if you need any additional information or have any questions.</p><p>We''re here to help!</p><p>Best regards,<br>{sender_name}</p>',
        'Hello {customer_name},\n\nIt''s been a week since your inquiry about {inquiry_subject}. I wanted to check if you need any additional information or have any questions.\n\nWe''re here to help!\n\nBest regards,\n{sender_name}',
        'followup',
        '["customer_name", "inquiry_subject", "sender_name"]',
        1
      ),
      (
        '14-Day Follow-up',
        'Final follow-up - {customer_name}',
        '<p>Hi {customer_name},</p><p>This is my final follow-up regarding your inquiry about {inquiry_subject}.</p><p>If you''re still interested, please let me know. Otherwise, I''ll remove you from our follow-up list.</p><p>Thank you for your time.</p><p>Best regards,<br>{sender_name}</p>',
        'Hi {customer_name},\n\nThis is my final follow-up regarding your inquiry about {inquiry_subject}.\n\nIf you''re still interested, please let me know. Otherwise, I''ll remove you from our follow-up list.\n\nThank you for your time.\n\nBest regards,\n{sender_name}',
        'followup',
        '["customer_name", "inquiry_subject", "sender_name"]',
        1
      ),
      (
        'RFQ Response Template',
        'Quote for your inquiry - Order #{order_id}',
        '<p>Dear {customer_name},</p><p>Thank you for your request for quote. Please find the details below:</p><p><strong>Order ID:</strong> {order_id}</p><p><strong>Products:</strong></p><ul>{product_list}</ul><p><strong>Total:</strong> {total_amount}</p><p>This quote is valid for 30 days. Please let us know if you have any questions.</p><p>Best regards,<br>{sender_name}</p>',
        'Dear {customer_name},\n\nThank you for your request for quote. Please find the details below:\n\nOrder ID: {order_id}\nProducts:\n{product_list}\nTotal: {total_amount}\n\nThis quote is valid for 30 days. Please let us know if you have any questions.\n\nBest regards,\n{sender_name}',
        'rfq_response',
        '["customer_name", "order_id", "product_list", "total_amount", "sender_name"]',
        1
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Inserted default email templates');

    console.log('🎉 Email system database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating email system tables:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the setup
createEmailSystemTables().catch(console.error);
