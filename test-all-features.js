require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function testAllFeatures() {
  console.log('🧪 Testing all implemented features...\n');
  
  try {
    // Test 1: Staff Assignment Query
    console.log('1️⃣ Testing Staff Assignment Query...');
    const staffAssignmentTest = await pool.query(`
      SELECT DISTINCT 
        cs.id,
        cs.customer_phone,
        cs.status as session_status,
        cs.last_message_at,
        cs.assigned_staff_id,
        c.name as customer_name,
        cm.message_text as last_message,
        cm.message_type as last_message_type,
        su.username as staff_assigned,
        su.first_name as staff_first_name,
        su.last_name as staff_last_name
      FROM chat_sessions cs
      LEFT JOIN customers c ON c.phone = cs.customer_phone
      LEFT JOIN staff_users su ON cs.assigned_staff_id = su.id
      LEFT JOIN LATERAL (
        SELECT message_text, message_type 
        FROM chat_messages 
        WHERE session_id = cs.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) cm ON true
      WHERE cs.status != 'closed' OR cs.status IS NULL
      ORDER BY cs.last_message_at DESC NULLS LAST
      LIMIT 3
    `);
    console.log('✅ Staff Assignment Query Works');
    console.log(`📊 Found ${staffAssignmentTest.rows.length} active chats`);
    if (staffAssignmentTest.rows.length > 0) {
      console.log(`📋 Sample chat:`, {
        id: staffAssignmentTest.rows[0].id,
        customer: staffAssignmentTest.rows[0].customer_name || staffAssignmentTest.rows[0].customer_phone,
        assigned_staff: staffAssignmentTest.rows[0].staff_assigned || 'Unassigned'
      });
    }
    
    // Test 2: RFQ Products Query  
    console.log('\n2️⃣ Testing RFQ Products Query...');
    const testPhone = '27744203713'; // Pieter Kemp
    const rfqTest = await pool.query(`
      SELECT r.*, array_agg(
        json_build_object(
          'id', p.id,
          'name', p.product_name,
          'sku', p.product_sku,
          'quantity', p.quantity,
          'price', p.price,
          'total', p.total,
          'product_id', p.product_id,
          'variation_id', p.variation_id
        ) ORDER BY p.id
      ) as products
      FROM rfq_requests r
      LEFT JOIN rfq_products p ON r.id = p.rfq_id
      WHERE r.customer_phone = $1
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 2
    `, [testPhone]);
    console.log('✅ RFQ Products Query Works');
    console.log(`📊 Found ${rfqTest.rows.length} RFQ requests for ${testPhone}`);
    if (rfqTest.rows.length > 0) {
      const rfq = rfqTest.rows[0];
      console.log(`📋 Sample RFQ:`, {
        id: rfq.id,
        order_number: rfq.order_number,
        total: rfq.total_amount,
        currency: rfq.currency,
        products_count: rfq.products?.[0]?.name ? rfq.products.length : 0
      });
    }
    
    // Test 3: Customer Notes Query
    console.log('\n3️⃣ Testing Customer Notes Query...');
    const notesTest = await pool.query(`
      SELECT cn.*, su.username as staff_name, su.first_name, su.last_name
      FROM customer_notes cn
      LEFT JOIN staff_users su ON cn.staff_user_id = su.id OR cn.created_by = su.id
      WHERE cn.customer_phone = $1
      ORDER BY cn.created_at DESC
      LIMIT 3
    `, [testPhone]);
    console.log('✅ Customer Notes Query Works');
    console.log(`📊 Found ${notesTest.rows.length} notes for ${testPhone}`);
    if (notesTest.rows.length > 0) {
      console.log(`📋 Sample note:`, {
        id: notesTest.rows[0].id,
        content: notesTest.rows[0].note_text?.substring(0, 50) + '...',
        staff: notesTest.rows[0].staff_name || 'Unknown',
        created: notesTest.rows[0].created_at
      });
    }
    
    // Test 4: Staff List Query
    console.log('\n4️⃣ Testing Staff List Query...');
    const staffTest = await pool.query(`
      SELECT id, username, first_name, last_name, role 
      FROM staff_users 
      WHERE is_active = true 
      ORDER BY first_name, last_name
    `);
    console.log('✅ Staff List Query Works');
    console.log(`📊 Found ${staffTest.rows.length} active staff members`);
    staffTest.rows.forEach(staff => {
      console.log(`👤 ${staff.first_name} ${staff.last_name} (@${staff.username}) - ${staff.role}`);
    });
    
    // Test 5: Insert Note Test
    console.log('\n5️⃣ Testing Note Insert...');
    const insertResult = await pool.query(`
      INSERT INTO customer_notes (customer_phone, note_text, content, staff_user_id, created_by, created_at)
      VALUES ($1, $2, $2, (SELECT id FROM staff_users WHERE username = 'Pieter87'), (SELECT id FROM staff_users WHERE username = 'Pieter87'), NOW())
      RETURNING id, note_text, staff_user_id, created_by
    `, [testPhone, 'Test note from feature verification script']);
    
    if (insertResult.rows.length > 0) {
      console.log('✅ Note Insert Works');
      console.log(`📝 Created note ID: ${insertResult.rows[0].id}`);
      
      // Clean up test note
      await pool.query('DELETE FROM customer_notes WHERE id = $1', [insertResult.rows[0].id]);
      console.log('🧹 Cleaned up test note');
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Staff assignment column added to chat_sessions');
    console.log('✅ Staff assignment queries working');
    console.log('✅ RFQ product queries fixed (rfq_id, product_name)');
    console.log('✅ Customer notes queries fixed (note_text, staff_user_id)');
    console.log('✅ Note insertion working with both column sets');
    console.log('✅ Staff list queries working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testAllFeatures();