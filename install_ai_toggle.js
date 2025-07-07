// Test database connection and install AI toggle safely
// This connects to the same PostgreSQL database that Bob3.1 uses

const { Pool } = require('pg');

// Database configuration (same as Bob3.1)
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

async function checkDatabaseAndInstallAI() {
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    
    // Step 1: Check what tables exist
    console.log('\n📋 Checking existing tables...');
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Step 2: Check if chat_messages table exists (this is critical for our trigger)
    const chatMessagesExists = tablesResult.rows.some(row => row.table_name === 'chat_messages');
    console.log(`\n✅ chat_messages table exists: ${chatMessagesExists}`);
    
    if (!chatMessagesExists) {
      console.log('⚠️  WARNING: chat_messages table not found. Trigger will not be created.');
    }
    
    // Step 3: Check if ai_controls table already exists
    const aiControlsExists = tablesResult.rows.some(row => row.table_name === 'ai_controls');
    console.log(`📊 ai_controls table exists: ${aiControlsExists}`);
    
    if (aiControlsExists) {
      console.log('ℹ️  AI controls already installed. Updating functions only...');
    }
    
    // Step 4: Install AI controls safely
    console.log('\n🚀 Installing AI toggle functionality...');
    
    // Create ai_controls table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_controls (
          phone_number VARCHAR(20) PRIMARY KEY,
          ai_enabled BOOLEAN DEFAULT TRUE,
          ai_disabled_at TIMESTAMP NULL,
          last_human_message_at TIMESTAMP NULL,
          auto_reenable_hours INTEGER DEFAULT 3,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ ai_controls table ready');
    
    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_ai_controls_status ON ai_controls(ai_enabled, ai_disabled_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_ai_controls_reenable ON ai_controls(last_human_message_at, auto_reenable_hours) WHERE ai_enabled = FALSE`);
    console.log('✅ Indexes created');
    
    // Create the get_or_create function
    await db.query(`
      CREATE OR REPLACE FUNCTION get_or_create_ai_control(p_phone_number VARCHAR(20))
      RETURNS TABLE(phone_number VARCHAR(20), ai_enabled BOOLEAN, ai_disabled_at TIMESTAMP, last_human_message_at TIMESTAMP, auto_reenable_hours INTEGER) AS $$
      BEGIN
          INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
          VALUES (p_phone_number, TRUE, 3)
          ON CONFLICT (phone_number) DO NOTHING;
          
          RETURN QUERY
          SELECT ac.phone_number, ac.ai_enabled, ac.ai_disabled_at, ac.last_human_message_at, ac.auto_reenable_hours
          FROM ai_controls ac
          WHERE ac.phone_number = p_phone_number;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ get_or_create_ai_control function created');
    
    // Create the can_ai_respond function
    await db.query(`
      CREATE OR REPLACE FUNCTION can_ai_respond(p_phone_number VARCHAR(20))
      RETURNS BOOLEAN AS $$
      DECLARE
          ai_status BOOLEAN;
          disabled_at TIMESTAMP;
          last_human_at TIMESTAMP;
          reenable_hours INTEGER;
          hours_since_human NUMERIC;
      BEGIN
          SELECT ai_enabled, ai_disabled_at, last_human_message_at, auto_reenable_hours
          INTO ai_status, disabled_at, last_human_at, reenable_hours
          FROM get_or_create_ai_control(p_phone_number);
          
          IF ai_status = TRUE THEN
              RETURN TRUE;
          END IF;
          
          IF last_human_at IS NULL THEN
              RETURN FALSE;
          END IF;
          
          hours_since_human := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_at)) / 3600;
          
          IF hours_since_human >= reenable_hours THEN
              UPDATE ai_controls 
              SET ai_enabled = TRUE, 
                  ai_disabled_at = NULL,
                  updated_at = CURRENT_TIMESTAMP
              WHERE phone_number = p_phone_number;
              
              RETURN TRUE;
          END IF;
          
          RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ can_ai_respond function created');
    
    // Create toggle function
    await db.query(`
      CREATE OR REPLACE FUNCTION toggle_ai_status(p_phone_number VARCHAR(20), p_enabled BOOLEAN)
      RETURNS BOOLEAN AS $$
      BEGIN
          PERFORM get_or_create_ai_control(p_phone_number);
          
          UPDATE ai_controls 
          SET ai_enabled = p_enabled,
              ai_disabled_at = CASE WHEN p_enabled = FALSE THEN CURRENT_TIMESTAMP ELSE NULL END,
              updated_at = CURRENT_TIMESTAMP
          WHERE phone_number = p_phone_number;
          
          RETURN p_enabled;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ toggle_ai_status function created');
    
    // Create disable function
    await db.query(`
      CREATE OR REPLACE FUNCTION disable_ai_for_human_takeover(p_phone_number VARCHAR(20))
      RETURNS BOOLEAN AS $$
      BEGIN
          PERFORM get_or_create_ai_control(p_phone_number);
          
          UPDATE ai_controls 
          SET ai_enabled = FALSE,
              ai_disabled_at = CURRENT_TIMESTAMP,
              last_human_message_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE phone_number = p_phone_number;
          
          RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ disable_ai_for_human_takeover function created');
    
    // Create reenable function
    await db.query(`
      CREATE OR REPLACE FUNCTION reenable_ai_after_timeout()
      RETURNS INTEGER AS $$
      DECLARE
          updated_count INTEGER := 0;
      BEGIN
          UPDATE ai_controls 
          SET ai_enabled = TRUE, 
              ai_disabled_at = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE ai_enabled = FALSE 
          AND last_human_message_at IS NOT NULL
          AND auto_reenable_hours IS NOT NULL
          AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_message_at)) / 3600 >= auto_reenable_hours;
          
          GET DIAGNOSTICS updated_count = ROW_COUNT;
          RETURN updated_count;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ reenable_ai_after_timeout function created');
    
    // Create trigger function
    await db.query(`
      CREATE OR REPLACE FUNCTION auto_disable_ai_on_human_message()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.sender_type IN ('staff', 'human', 'agent') THEN
              PERFORM disable_ai_for_human_takeover(NEW.customer_phone);
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ auto_disable_ai_on_human_message trigger function created');
    
    // Create trigger only if chat_messages exists and trigger doesn't exist
    if (chatMessagesExists) {
      const triggerCheck = await db.query(`
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'auto_disable_ai_trigger' 
        AND event_object_table = 'chat_messages'
      `);
      
      if (triggerCheck.rows.length === 0) {
        await db.query(`
          CREATE TRIGGER auto_disable_ai_trigger
              AFTER INSERT ON chat_messages
              FOR EACH ROW
              EXECUTE FUNCTION auto_disable_ai_on_human_message()
        `);
        console.log('✅ auto_disable_ai_trigger created');
      } else {
        console.log('ℹ️  auto_disable_ai_trigger already exists');
      }
    }
    
    // Create updated_at trigger for ai_controls
    await db.query(`
      CREATE OR REPLACE FUNCTION update_ai_controls_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    const updatedAtTriggerCheck = await db.query(`
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'update_ai_controls_updated_at_trigger' 
      AND event_object_table = 'ai_controls'
    `);
    
    if (updatedAtTriggerCheck.rows.length === 0) {
      await db.query(`
        CREATE TRIGGER update_ai_controls_updated_at_trigger
            BEFORE UPDATE ON ai_controls
            FOR EACH ROW
            EXECUTE FUNCTION update_ai_controls_updated_at()
      `);
      console.log('✅ update_ai_controls_updated_at_trigger created');
    } else {
      console.log('ℹ️  update_ai_controls_updated_at_trigger already exists');
    }
    
    // Step 5: Test the functions
    console.log('\n🧪 Testing AI functions...');
    const testResult = await db.query("SELECT can_ai_respond('test123') as test_result");
    console.log(`✅ Test result: ${testResult.rows[0].test_result}`);
    
    const toggleResult = await db.query("SELECT toggle_ai_status('test123', false) as toggle_result");
    console.log(`✅ Toggle test: ${toggleResult.rows[0].toggle_result}`);
    
    const statusResult = await db.query("SELECT * FROM get_or_create_ai_control('test123')");
    console.log(`✅ Status test:`, statusResult.rows[0]);
    
    console.log('\n🎉 AI Toggle installation completed successfully!');
    console.log('\nFor n8n workflow, use this query:');
    console.log("SELECT can_ai_respond('{{ $node[\"Webhook\"].json[\"phone_number\"] }}') as ai_can_respond;");
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

// Run the installation
checkDatabaseAndInstallAI();
