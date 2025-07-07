const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function fixTabbyRFQ() {
  try {
    console.log('🔧 Fixing Tabby Thibedi RFQ - adding missing chat session and message...');
    
    const customerPhone = '27823357013';
    const customerName = 'Tabby Thibedi';
    
    // 1. Create chat session
    console.log('1️⃣ Creating chat session...');
    const sessionResult = await pool.query(`
      INSERT INTO chat_sessions (customer_phone, session_id, status, created_at, updated_at, last_message_at)
      VALUES ($1, $2, 'active', NOW(), NOW(), NOW())
      RETURNING id
    `, [customerPhone, `session_${customerPhone}`]);
    
    const sessionId = sessionResult.rows[0].id;
    console.log('✅ Chat session created with ID:', sessionId);
    
    // 2. Get RFQ details for the message
    const rfqResult = await pool.query(`
      SELECT r.*, p.product_name, p.price, p.quantity, p.total
      FROM rfq_requests r
      LEFT JOIN rfq_products p ON r.id = p.rfq_id
      WHERE r.customer_phone = $1
      ORDER BY r.created_at DESC
      LIMIT 1
    `, [customerPhone]);
    
    if (rfqResult.rows.length === 0) {
      throw new Error('No RFQ found for Tabby');
    }
    
    const rfq = rfqResult.rows[0];
    console.log('📋 RFQ Details:', {
      order: rfq.order_number,
      total: rfq.total_amount,
      product: rfq.product_name
    });
    
    // 3. Create RFQ response message
    const rfqMessage = `Hi ${customerName},

Thank you for your RFQ submission. I've just sent your personalized quotation to your email address.

Quote Summary:
• ${rfq.product_name} - R${rfq.price} + VAT
Total Investment: R${rfq.total_amount} (incl. VAT)

Please check your email for the complete quote details and terms. If you have any questions about the quotation or would like to learn more about our flexible financing options available, I'm here to help. Would you prefer a quick call to discuss, or feel free to reply here with any questions.

Best regards,
MCM Bob`;

    console.log('2️⃣ Adding RFQ response message...');
    const messageResult = await pool.query(`
      INSERT INTO chat_messages (
        session_id, 
        customer_phone, 
        message_text, 
        message_type, 
        sender_type, 
        metadata, 
        created_at,
        message_status
      ) VALUES (
        $1, $2, $3, 'text', 'ai', 
        $4, NOW(), 'sent'
      ) RETURNING id
    `, [
      sessionId,
      customerPhone,
      rfqMessage,
      JSON.stringify({
        source: 'rfq_response',
        rfq_id: rfq.id,
        order_id: rfq.order_id,
        order_number: rfq.order_number
      })
    ]);
    
    console.log('✅ RFQ response message added with ID:', messageResult.rows[0].id);
    
    // 4. Update chat session with latest message time
    await pool.query(`
      UPDATE chat_sessions 
      SET last_message_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [sessionId]);
    
    console.log('✅ Chat session updated');
    
    console.log('\n🎉 Tabby Thibedi RFQ is now fixed!');
    console.log('   - Chat session created');
    console.log('   - RFQ response message added');
    console.log('   - Should now appear in Bob Explorer app');
    
  } catch (error) {
    console.error('❌ Error fixing Tabby RFQ:', error);
  } finally {
    await pool.end();
  }
}

fixTabbyRFQ();
