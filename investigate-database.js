const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function investigateDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // 1. List all tables
    console.log('\n📋 ALL TABLES:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    tables.rows.forEach(row => console.log(' -', row.table_name));
    
    // 2. Check chat_messages structure
    console.log('\n📨 CHAT_MESSAGES TABLE STRUCTURE:');
    const chatColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages'
      ORDER BY ordinal_position
    `);
    chatColumns.rows.forEach(row => 
      console.log(` - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    );
    
    // 3. Check latest messages for your number
    console.log('\n📱 LATEST MESSAGES FOR 27744203713:');
    const messages = await client.query(`
      SELECT id, message_text, message_type, media_url, sender_type, created_at, metadata
      FROM chat_messages 
      WHERE customer_phone = '27744203713' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    messages.rows.forEach(row => {
      console.log(`\n=== MESSAGE ID: ${row.id} ===`);
      console.log('Text:', row.message_text);
      console.log('Type:', row.message_type);
      console.log('Sender:', row.sender_type);
      console.log('Media URL:', row.media_url || 'NULL');
      console.log('Created:', row.created_at);
      
      if (row.metadata) {
        try {
          const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          console.log('Source:', metadata.source);
        } catch (e) {
          console.log('Metadata parse error');
        }
      }
    });
    
    // 4. Check chat_sessions
    console.log('\n👥 CHAT SESSIONS FOR 27744203713:');
    const sessions = await client.query(`
      SELECT id, customer_phone, created_at, updated_at 
      FROM chat_sessions 
      WHERE customer_phone = '27744203713'
      ORDER BY created_at DESC
    `);
    sessions.rows.forEach(row => 
      console.log(`Session ${row.id}: Created ${row.created_at}, Updated ${row.updated_at}`)
    );
    
    // 5. Check customers table
    console.log('\n👤 CUSTOMERS TABLE:');
    const customers = await client.query(`
      SELECT phone, name, created_at 
      FROM customers 
      WHERE phone LIKE '%27744203713%'
      ORDER BY created_at DESC
    `);
    customers.rows.forEach(row => 
      console.log(`Customer: ${row.phone} (${row.name}) - Created: ${row.created_at}`)
    );
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

investigateDatabase();
