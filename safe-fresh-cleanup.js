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

async function safeDataCleanup() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🧹 Starting safe data cleanup...\n');
    
    // First, let's see what we're preserving
    const adminUsers = await db.query('SELECT id, username, email FROM staff_users');
    console.log('👤 Admin users to PRESERVE:', adminUsers.rows);
    
    // Check email settings to preserve
    const emailSettings = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%email%'
      AND table_name NOT LIKE '%customer%'
    `);
    console.log('📧 Email settings tables to PRESERVE:', emailSettings.rows.map(r => r.table_name));
    
    // Show what will be cleared
    const tablesToClear = [
      'chat_messages',
      'chat_sessions', 
      'customers',
      'rfq_requests',
      'rfq_products',
      'customer_notes'
    ];
    
    console.log('\n🗑️ Tables to CLEAR (data only):');
    tablesToClear.forEach(table => console.log(`  - ${table}`));
    
    // Check counts before clearing
    console.log('\n📊 Current data counts:');
    for (const table of tablesToClear) {
      try {
        const count = await db.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  - ${table}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`  - ${table}: Table not found or error`);
      }
    }
    
    console.log('\n⚠️ Starting cleanup in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Clear data (order matters due to foreign keys)
    console.log('\n🧹 Clearing data...');
    
    // Clear messages first (references chat_sessions)
    await db.query('TRUNCATE TABLE chat_messages CASCADE');
    console.log('✅ Cleared chat_messages');
    
    // Clear RFQ products (references rfq_requests) 
    await db.query('TRUNCATE TABLE rfq_products CASCADE');
    console.log('✅ Cleared rfq_products');
    
    // Clear RFQ requests (references customers)
    await db.query('TRUNCATE TABLE rfq_requests CASCADE');
    console.log('✅ Cleared rfq_requests');
    
    // Clear customer notes (references customers)
    try {
      await db.query('TRUNCATE TABLE customer_notes CASCADE');
      console.log('✅ Cleared customer_notes');
    } catch (error) {
      console.log('⚠️ customer_notes table not found or already empty');
    }
    
    // Clear chat sessions (references customers)
    await db.query('TRUNCATE TABLE chat_sessions CASCADE');
    console.log('✅ Cleared chat_sessions');
    
    // Clear customers last
    await db.query('TRUNCATE TABLE customers CASCADE');
    console.log('✅ Cleared customers');
    
    // Reset sequences for clean IDs
    const sequences = [
      'customers_id_seq',
      'chat_sessions_id_seq', 
      'chat_messages_id_seq',
      'rfq_requests_id_seq',
      'rfq_products_id_seq'
    ];
    
    console.log('\n🔄 Resetting ID sequences...');
    for (const seq of sequences) {
      try {
        await db.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`✅ Reset ${seq}`);
      } catch (error) {
        console.log(`⚠️ Sequence ${seq} not found`);
      }
    }
    
    // Verify cleanup
    console.log('\n📊 Post-cleanup verification:');
    for (const table of tablesToClear) {
      try {
        const count = await db.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  - ${table}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`  - ${table}: Error checking count`);
      }
    }
    
    // Verify admin users are still there
    const remainingAdmins = await db.query('SELECT id, username, email FROM staff_users');
    console.log('\n👤 Admin users PRESERVED:', remainingAdmins.rows);
    
    console.log('\n✅ Safe cleanup completed! Ready for fresh testing.');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await db.end();
  }
}

safeDataCleanup();
