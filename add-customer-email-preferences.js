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

async function addCustomerEmailPreferences() {
  console.log('🔧 Adding customer email preferences table...');
  
  try {
    // Create customer email preferences table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_email_preferences (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        auto_followups_enabled BOOLEAN DEFAULT false,
        marketing_emails_enabled BOOLEAN DEFAULT true,
        rfq_notifications_enabled BOOLEAN DEFAULT true,
        followup_frequency VARCHAR(20) DEFAULT 'standard', -- 'none', 'light', 'standard', 'aggressive'
        preferred_email VARCHAR(255),
        unsubscribed BOOLEAN DEFAULT false,
        unsubscribed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(customer_id)
      );
    `);
    console.log('✅ Created customer_email_preferences table');

    // Create index for performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_customer_email_prefs_customer ON customer_email_preferences(customer_id);');
    console.log('✅ Created index for customer email preferences');

    // Add email preferences columns to customers table if not exists
    await db.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS email_bounce_count INTEGER DEFAULT 0;
    `);
    console.log('✅ Added email tracking columns to customers table');

    // Insert default preferences for existing customers
    await db.query(`
      INSERT INTO customer_email_preferences (customer_id, auto_followups_enabled)
      SELECT id, false FROM customers 
      WHERE id NOT IN (SELECT customer_id FROM customer_email_preferences WHERE customer_id IS NOT NULL)
      ON CONFLICT (customer_id) DO NOTHING;
    `);
    console.log('✅ Added default email preferences for existing customers');

    console.log('🎉 Customer email preferences setup completed!');
    
  } catch (error) {
    console.error('❌ Error adding customer email preferences:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the setup
addCustomerEmailPreferences().catch(console.error);
