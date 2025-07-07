const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function finalCleanup() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('\n🔧 CHECKING CURRENT STATE...');
    
    // Check current customers
    const customers = await client.query(`
      SELECT phone, name, created_at FROM customers 
      WHERE phone LIKE '%27744203713%' 
      ORDER BY created_at DESC
    `);
    
    console.log('Current customers:');
    customers.rows.forEach(row => {
      console.log(`- ${row.phone} (${row.name}) - ${row.created_at}`);
    });
    
    // Check latest messages to verify media URLs
    const latestMessages = await client.query(`
      SELECT id, message_text, message_type, media_url, sender_type, created_at
      FROM chat_messages 
      WHERE customer_phone = '27744203713' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\nLatest messages:');
    latestMessages.rows.forEach(row => {
      console.log(`\n=== MESSAGE ID: ${row.id} ===`);
      console.log('Text:', row.message_text);
      console.log('Type:', row.message_type);
      console.log('Sender:', row.sender_type);
      console.log('Media URL:', row.media_url || 'NULL');
      console.log('Created:', row.created_at);
    });
    
    console.log('\n✅ Database state checked. The audio URLs should be working in the app now.');
    console.log('📝 If you still see "Unable to play audio", check the browser console for debug logs.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

finalCleanup();
