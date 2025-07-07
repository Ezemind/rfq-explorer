const { Client } = require('pg');

const client = new Client({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net', 
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function cleanupDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // 1. Clear the tables you requested
    console.log('\n🗑️ CLEARING REQUESTED TABLES...');
    
    const tablesToClear = ['customers', 'rfq_products', 'rfq_requests', 'customer_notes'];
    
    for (const table of tablesToClear) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}: ${result.rowCount} rows deleted`);
      } catch (error) {
        console.log(`⚠️ Could not clear ${table}: ${error.message}`);
      }
    }
    
    // 2. Clean up duplicate customers (keep the one with name)
    console.log('\n👤 FIXING CUSTOMER DUPLICATES...');
    
    // First, let's see what we have
    const customersBefore = await client.query(`
      SELECT phone, name, created_at 
      FROM customers 
      ORDER BY phone, created_at
    `);
    
    console.log('Customers before cleanup:', customersBefore.rows.length);
    
    // Delete the customer without name (the +27744203713 one)
    const deleteResult = await client.query(`
      DELETE FROM customers 
      WHERE phone = '+27744203713' AND name = '+27744203713'
    `);
    console.log(`Deleted duplicate customer: ${deleteResult.rowCount} rows`);
    
    // 3. Keep only the latest chat session
    console.log('\n💬 CLEANING UP CHAT SESSIONS...');
    
    const sessionsBefore = await client.query(`
      SELECT id, customer_phone, created_at 
      FROM chat_sessions 
      WHERE customer_phone = '27744203713'
      ORDER BY created_at DESC
    `);
    
    console.log('Sessions before cleanup:', sessionsBefore.rows.length);
    
    if (sessionsBefore.rows.length > 1) {
      // Keep the latest session, delete others
      const latestSessionId = sessionsBefore.rows[0].id;
      const deleteSessionsResult = await client.query(`
        DELETE FROM chat_sessions 
        WHERE customer_phone = '27744203713' AND id != $1
      `, [latestSessionId]);
      console.log(`Deleted old sessions: ${deleteSessionsResult.rowCount} rows`);
    }
    
    // 4. Recreate customer with clean data
    console.log('\n👤 RECREATING CUSTOMER...');
    
    await client.query(`
      INSERT INTO customers (phone, name, created_at) 
      VALUES ('27744203713', 'Pieter Kemp', CURRENT_TIMESTAMP)
      ON CONFLICT (phone) DO UPDATE SET 
        name = EXCLUDED.name,
        created_at = EXCLUDED.created_at
    `);
    console.log('✅ Customer recreated with clean data');
    
    // 5. Show final status
    console.log('\n📊 FINAL STATUS:');
    
    const finalCustomers = await client.query(`
      SELECT phone, name FROM customers WHERE phone LIKE '%27744203713%'
    `);
    console.log('Customers now:', finalCustomers.rows);
    
    const finalSessions = await client.query(`
      SELECT id, customer_phone FROM chat_sessions WHERE customer_phone = '27744203713'
    `);
    console.log('Sessions now:', finalSessions.rows);
    
    const messageCount = await client.query(`
      SELECT COUNT(*) as count FROM chat_messages WHERE customer_phone = '27744203713'
    `);
    console.log('Message count:', messageCount.rows[0].count);
    
    console.log('\n✅ Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

cleanupDatabase();
