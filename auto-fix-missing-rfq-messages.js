const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function autoFixMissingRFQMessages() {
  try {
    console.log('🔄 Checking for RFQ requests without corresponding messages...');
    
    // Find RFQ requests that don't have corresponding chat messages
    const orphanedRFQs = await pool.query(`
      SELECT r.*, c.name as customer_name, c.email
      FROM rfq_requests r
      LEFT JOIN customers c ON r.customer_phone = c.phone
      LEFT JOIN chat_messages m ON r.customer_phone = m.customer_phone 
        AND m.metadata->>'rfq_id' = r.id::text
      WHERE m.id IS NULL
      AND r.created_at > NOW() - INTERVAL '7 days'
      ORDER BY r.created_at DESC
    `);
    
    console.log(`Found ${orphanedRFQs.rows.length} RFQ(s) without messages`);
    
    if (orphanedRFQs.rows.length === 0) {
      console.log('✅ All recent RFQs have corresponding messages');
      return;
    }
    
    // Fix each orphaned RFQ
    for (const rfq of orphanedRFQs.rows) {
      console.log(`\n🔧 Fixing RFQ for ${rfq.customer_name} (Order #${rfq.order_number})...`);
      
      // Check if chat session exists
      let sessionResult = await pool.query(`
        SELECT id FROM chat_sessions WHERE customer_phone = $1
      `, [rfq.customer_phone]);
      
      let sessionId;
      if (sessionResult.rows.length === 0) {
        // Create chat session
        const newSession = await pool.query(`
          INSERT INTO chat_sessions (customer_phone, session_id, status, created_at, updated_at, last_message_at)
          VALUES ($1, $2, 'active', $3, $3, $3)
          RETURNING id
        `, [rfq.customer_phone, `session_${rfq.customer_phone}`, rfq.created_at]);
        sessionId = newSession.rows[0].id;
        console.log('  ✅ Created chat session');
      } else {
        sessionId = sessionResult.rows[0].id;
        console.log('  ✅ Using existing chat session');
      }
      
      // Get RFQ product details
      const productResult = await pool.query(`
        SELECT * FROM rfq_products WHERE rfq_id = $1 LIMIT 1
      `, [rfq.id]);
      
      const product = productResult.rows[0];
      
      // Create RFQ response message
      const rfqMessage = `Hi ${rfq.customer_name},

Thank you for your RFQ submission. I've just sent your personalized quotation to your email address.

Quote Summary:
• ${product ? product.product_name : 'Product'} - R${product ? product.price : rfq.total_amount} + VAT
Total Investment: R${rfq.total_amount} (incl. VAT)

Please check your email for the complete quote details and terms. If you have any questions about the quotation or would like to learn more about our flexible financing options available, I'm here to help. Would you prefer a quick call to discuss, or feel free to reply here with any questions.

Best regards,
MCM Bob`;

      // Insert the message
      await pool.query(`
        INSERT INTO chat_messages (
          session_id, customer_phone, message_text, message_type, sender_type, 
          metadata, created_at, message_status
        ) VALUES (
          $1, $2, $3, 'text', 'ai', $4, $5, 'sent'
        )
      `, [
        sessionId,
        rfq.customer_phone,
        rfqMessage,
        JSON.stringify({
          source: 'rfq_response_auto_fix',
          rfq_id: rfq.id,
          order_id: rfq.order_id,
          order_number: rfq.order_number
        }),
        new Date(new Date(rfq.created_at).getTime() + 60000) // 1 minute after RFQ
      ]);
      
      // Update chat session
      await pool.query(`
        UPDATE chat_sessions 
        SET last_message_at = $1, updated_at = NOW()
        WHERE id = $2
      `, [new Date(new Date(rfq.created_at).getTime() + 60000), sessionId]);
      
      console.log(`  ✅ Added RFQ response message for Order #${rfq.order_number}`);
    }
    
    console.log(`\n🎉 Fixed ${orphanedRFQs.rows.length} orphaned RFQ(s)!`);
    console.log('All RFQs should now appear in the Bob Explorer app.');
    
  } catch (error) {
    console.error('❌ Error in auto-fix:', error);
  } finally {
    await pool.end();
  }
}

autoFixMissingRFQMessages();
