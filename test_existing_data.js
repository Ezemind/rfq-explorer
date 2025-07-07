// Test auto-disable with existing data
const { Pool } = require('pg');

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

async function testWithExistingData() {
  try {
    console.log('🧪 Testing Auto-Disable with Existing Data...\n');
    
    // Find existing chat sessions and customers
    console.log('Step 1: Finding existing customers and sessions...');
    const existingChats = await db.query(`
      SELECT cs.id as session_id, cs.customer_phone, c.name as customer_name
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_phone = c.phone
      LIMIT 5
    `);
    
    if (existingChats.rows.length === 0) {
      console.log('❌ No existing chat sessions found. Creating a test customer first...');
      
      // Create a test customer
      await db.query(`
        INSERT INTO customers (phone, name, created_at)
        VALUES ('27888999111', 'Test Customer', NOW())
        ON CONFLICT (phone) DO NOTHING
      `);
      
      // Create a chat session
      const newSession = await db.query(`
        INSERT INTO chat_sessions (customer_phone, status, created_at, last_message_at)
        VALUES ('27888999111', 'active', NOW(), NOW())
        RETURNING id, customer_phone
      `);
      
      const testData = {
        session_id: newSession.rows[0].id,
        customer_phone: newSession.rows[0].customer_phone,
        customer_name: 'Test Customer'
      };
      
      console.log(`✅ Created test data:`, testData);
      await testAutoDisableLogic(testData);
      
    } else {
      console.log('✅ Found existing chat sessions:');
      existingChats.rows.forEach(row => {
        console.log(`   Session ${row.session_id}: ${row.customer_phone} (${row.customer_name || 'No name'})`);
      });
      
      // Use the first existing session for testing
      await testAutoDisableLogic(existingChats.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

async function testAutoDisableLogic(chatData) {
  const { session_id, customer_phone, customer_name } = chatData;
  
  console.log(`\n🎯 Testing auto-disable with: ${customer_phone} (${customer_name})`);
  
  // Step 1: Ensure AI is enabled initially
  console.log('\nStep 1: Enabling AI...');
  await db.query(`SELECT toggle_ai_status('${customer_phone}', true)`);
  const initial = await db.query(`SELECT can_ai_respond('${customer_phone}') as result`);
  console.log(`✅ Initial AI status: ${initial.rows[0].result}`);
  
  // Step 2: Get current message count
  const beforeCount = await db.query(`
    SELECT COUNT(*) as count FROM chat_messages 
    WHERE customer_phone = '${customer_phone}'
  `);
  console.log(`📊 Messages before test: ${beforeCount.rows[0].count}`);
  
  // Step 3: Insert a staff message (this should trigger auto-disable)
  console.log('\nStep 2: Inserting staff message (should auto-disable AI)...');
  await db.query(`
    INSERT INTO chat_messages (
      session_id, 
      customer_phone, 
      message_text, 
      message_type, 
      sender_type, 
      created_at,
      staff_user_id
    ) VALUES (
      ${session_id}, 
      '${customer_phone}', 
      'Test staff message for auto-disable', 
      'text', 
      'staff', 
      NOW(),
      1
    )
  `);
  console.log('✅ Staff message inserted');
  
  // Step 4: Check if AI was automatically disabled
  console.log('\nStep 3: Checking AI status after staff message...');
  const afterStaff = await db.query(`SELECT can_ai_respond('${customer_phone}') as result`);
  console.log(`🤖 AI status after staff message: ${afterStaff.rows[0].result}`);
  
  if (afterStaff.rows[0].result === false) {
    console.log('🎉 SUCCESS! Auto-disable is working correctly!');
  } else {
    console.log('⚠️  AUTO-DISABLE NOT WORKING - AI should be disabled after staff message');
  }
  
  // Step 5: Check the ai_controls record
  const record = await db.query(`SELECT * FROM ai_controls WHERE phone_number = '${customer_phone}'`);
  if (record.rows.length > 0) {
    const rec = record.rows[0];
    console.log('\n📊 AI Control Record after staff message:');
    console.log(`   Phone: ${rec.phone_number}`);
    console.log(`   AI Enabled: ${rec.ai_enabled}`);
    console.log(`   Disabled At: ${rec.ai_disabled_at}`);
    console.log(`   Last Human Message: ${rec.last_human_message_at}`);
  }
  
  // Step 6: Test that customer messages don't disable AI
  console.log('\nStep 4: Testing customer message (should NOT disable AI)...');
  await db.query(`SELECT toggle_ai_status('${customer_phone}', true)`); // Re-enable first
  
  await db.query(`
    INSERT INTO chat_messages (
      session_id, customer_phone, message_text, message_type, sender_type, created_at
    ) VALUES (
      ${session_id}, '${customer_phone}', 'Test customer message', 'text', 'customer', NOW()
    )
  `);
  
  const afterCustomer = await db.query(`SELECT can_ai_respond('${customer_phone}') as result`);
  console.log(`👤 AI status after customer message: ${afterCustomer.rows[0].result} (should remain enabled)`);
  
  // Final verification
  console.log('\n🎯 Auto-Disable Test Summary:');
  if (afterStaff.rows[0].result === false && afterCustomer.rows[0].result === true) {
    console.log('✅ AUTO-DISABLE WORKING PERFECTLY!');
    console.log('✅ Staff messages disable AI automatically');
    console.log('✅ Customer messages do NOT disable AI');
    console.log('✅ Ready for production use');
  } else {
    console.log('❌ Auto-disable needs attention');
    console.log(`   Staff message result: ${afterStaff.rows[0].result} (should be false)`);
    console.log(`   Customer message result: ${afterCustomer.rows[0].result} (should be true)`);
  }
}

testWithExistingData();
