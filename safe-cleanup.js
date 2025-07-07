const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function safeCleanup() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // For now, let's just focus on getting the latest messages working
    // We'll update the customer phone format instead of deleting
    
    console.log('\n🔧 NORMALIZING CUSTOMER PHONE FORMATS...');
    
    // Update chat_sessions to use consistent phone format
    const updateSessions = await client.query(`
      UPDATE chat_sessions 
      SET customer_phone = '27744203713' 
      WHERE customer_phone = '+27744203713'
    `);
    console.log(`Updated sessions: ${updateSessions.rowCount} rows`);
    
    // Update chat_messages to use consistent phone format  
    const updateMessages = await client.query(`
      UPDATE chat_messages 
      SET customer_phone = '27744203713' 
      WHERE customer_phone = '+27744203713'
    `);
    console.log(`Updated messages: ${updateMessages.rowCount} rows`);
    
    // Update customers to use consistent phone format
    const updateCustomers = await client.query(`
      UPDATE customers 
      SET phone = '27744203713' 
      WHERE phone = '+27744203713'
    `);
    console.log(`Updated customers: ${updateCustomers.rowCount} rows`);
    
    console.log('\n📊 CURRENT STATUS:');
    
    // Check current messages
    const latestMessages = await client.query(`
      SELECT id, message_text, message_type, media_url, sender_type, created_at
      FROM chat_messages 
      WHERE customer_phone = '27744203713' 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('Latest messages:');
    latestMessages.rows.forEach(row => {
      console.log(`- ID ${row.id}: ${row.message_type} (${row.sender_type}) - ${row.media_url ? 'HAS MEDIA' : 'NO MEDIA'}`);
    });
    
    // Check customers
    const customers = await client.query(`
      SELECT phone, name FROM customers WHERE phone = '27744203713'
    `);
    console.log('Customer:', customers.rows[0] || 'NOT FOUND');
    
    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

safeCleanup();
