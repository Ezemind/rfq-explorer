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

async function createAutoSessionTrigger() {
  try {
    console.log('🔧 Creating automatic chat session trigger for new RFQs...\n');
    
    // Create a database function that automatically creates chat sessions for new RFQs
    await db.query(`
      CREATE OR REPLACE FUNCTION create_chat_session_for_rfq()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check if chat session already exists for this customer
        IF NOT EXISTS (
          SELECT 1 FROM chat_sessions 
          WHERE customer_phone = NEW.customer_phone
        ) THEN
          -- Create new chat session
          INSERT INTO chat_sessions (
            customer_phone, 
            status, 
            created_at, 
            updated_at, 
            last_message_at
          ) VALUES (
            NEW.customer_phone,
            'active',
            NEW.created_at,
            NEW.created_at,
            NEW.created_at
          );
          
          -- Create initial system message
          INSERT INTO chat_messages (
            session_id,
            customer_phone,
            message_text,
            message_type,
            sender_type,
            created_at,
            is_ai_response
          ) VALUES (
            (SELECT id FROM chat_sessions WHERE customer_phone = NEW.customer_phone ORDER BY created_at DESC LIMIT 1),
            NEW.customer_phone,
            '📋 Customer submitted RFQ #' || NEW.order_number || '. Ready to process quote.',
            'text',
            'system',
            NEW.created_at,
            false
          );
        ELSE
          -- Update existing session activity
          UPDATE chat_sessions 
          SET updated_at = NEW.created_at,
              last_message_at = NEW.created_at
          WHERE customer_phone = NEW.customer_phone;
          
          -- Add RFQ notification message
          INSERT INTO chat_messages (
            session_id,
            customer_phone,
            message_text,
            message_type,
            sender_type,
            created_at,
            is_ai_response
          ) VALUES (
            (SELECT id FROM chat_sessions WHERE customer_phone = NEW.customer_phone ORDER BY updated_at DESC LIMIT 1),
            NEW.customer_phone,
            '📋 New RFQ #' || NEW.order_number || ' submitted. Total: ' || COALESCE(NEW.currency, 'ZAR') || ' ' || COALESCE(NEW.total_amount::text, '0'),
            'text',
            'system',
            NEW.created_at,
            false
          );
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Created chat session trigger function');
    
    // Drop existing trigger if it exists
    await db.query(`DROP TRIGGER IF EXISTS rfq_chat_session_trigger ON rfq_requests;`);
    
    // Create trigger that fires when new RFQ is inserted
    await db.query(`
      CREATE TRIGGER rfq_chat_session_trigger
        AFTER INSERT ON rfq_requests
        FOR EACH ROW
        EXECUTE FUNCTION create_chat_session_for_rfq();
    `);
    
    console.log('✅ Created automatic RFQ chat session trigger');
    
    // Test the trigger by checking if it would work on existing data
    console.log('\n🧪 Testing trigger functionality...');
    
    // Check how many recent RFQs would trigger new sessions
    const testResult = await db.query(`
      SELECT COUNT(*) as would_create_sessions
      FROM rfq_requests r
      WHERE r.created_at > NOW() - INTERVAL '1 hour'
      AND NOT EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.customer_phone = r.customer_phone
      )
    `);
    
    console.log(`Would create ${testResult.rows[0].would_create_sessions} new sessions for recent RFQs`);
    
    console.log('\n✅ Auto-session creation trigger is now active!');
    console.log('📝 From now on, every new RFQ submission will automatically:');
    console.log('   1. Create a chat session if one doesn\'t exist');
    console.log('   2. Add a system message indicating the RFQ');
    console.log('   3. Update existing sessions with new RFQ notifications');
    
  } catch (error) {
    console.error('❌ Error creating trigger:', error);
  } finally {
    await db.end();
  }
}

createAutoSessionTrigger();
