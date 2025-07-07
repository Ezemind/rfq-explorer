const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function addMissingRFQMessage() {
  try {
    console.log('🔍 Adding the missing RFQ response message...');
    
    // Insert the RFQ response message that should have been stored
    const rfqMessageText = `Hi Pieter,

Thank you for your RFQ submission. I've just sent your personalized quotation to your email address.

Quote Summary:
• Aerobs BS50DU-2WD ATV - R149500 + VAT
Total Investment: R171925 (incl. VAT)

Please check your email for the complete quote details and terms. If you have any questions about the quotation or would like to learn more about our flexible financing options available, I'm here to help. Would you prefer a quick call to discuss, or feel free to reply here with any questions.

Best regards,
MCM Bob`;

    const result = await pool.query(`
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
        4, 
        '27744203713', 
        $1, 
        'text', 
        'ai', 
        '{"source": "rfq_response", "rfq_id": 75, "order_id": "20001"}', 
        '2025-06-30 13:22:00',
        'sent'
      ) RETURNING id
    `, [rfqMessageText]);
    
    console.log('✅ RFQ response message added with ID:', result.rows[0].id);
    
    // Update the chat session last message time
    await pool.query(`
      UPDATE chat_sessions 
      SET last_message_at = '2025-06-30 13:22:00', updated_at = NOW()
      WHERE customer_phone = '27744203713' AND id = 4
    `);
    
    console.log('✅ Chat session updated');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addMissingRFQMessage();
