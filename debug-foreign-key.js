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

async function analyzeForeignKeyIssue() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🔍 Analyzing foreign key constraint issue...\n');
    
    // Check customers table structure
    const customersColumns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    console.log('👥 CUSTOMERS table structure:');
    customersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Check chat_sessions table structure  
    const chatSessionsColumns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      ORDER BY ordinal_position
    `);
    console.log('\n💬 CHAT_SESSIONS table structure:');
    chatSessionsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Check foreign key constraints
    const constraints = await db.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'chat_sessions' OR tc.table_name = 'rfq_requests')
      ORDER BY tc.table_name
    `);
    console.log('\n🔗 Foreign key constraints for chat_sessions and rfq_requests:');
    constraints.rows.forEach(constraint => {
      console.log(`  - ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
    // Check if the problematic customer exists
    const customerCheck = await db.query('SELECT * FROM customers WHERE phone = $1', ['27827789522']);
    console.log(`\n🔍 Customer with phone 27827789522 exists: ${customerCheck.rows.length > 0 ? 'YES' : 'NO'}`);
    if (customerCheck.rows.length > 0) {
      console.log('Customer data:', JSON.stringify(customerCheck.rows[0], null, 2));
    }
    
    // Show recent customers
    const recentCustomers = await db.query('SELECT phone, name, created_at FROM customers ORDER BY created_at DESC LIMIT 5');
    console.log('\n👥 Recent customers:');
    recentCustomers.rows.forEach(customer => {
      console.log(`  - ${customer.phone} | ${customer.name || 'No name'} | ${customer.created_at}`);
    });
    
    // Check if there are any triggers or procedures that might be causing this
    const triggers = await db.query(`
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE event_object_table IN ('rfq_requests', 'chat_sessions')
    `);
    console.log('\n🎯 Database triggers:');
    if (triggers.rows.length > 0) {
      triggers.rows.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table} (${trigger.event_manipulation})`);
      });
    } else {
      console.log('  - No triggers found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await db.end();
  }
}

analyzeForeignKeyIssue();
