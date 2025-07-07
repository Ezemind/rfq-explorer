const { Pool } = require('pg');

const dbConfig = {
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
};

const db = new Pool(dbConfig);

async function checkEmailTableStructure() {
  try {
    console.log('🔍 Checking email table structure...');
    
    // Check email_accounts table structure
    const accountsStructure = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'email_accounts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📧 email_accounts table structure:');
    accountsStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check actual email accounts data
    const accounts = await db.query(`SELECT * FROM email_accounts WHERE is_active = true`);
    
    console.log('\n📧 Active Email Accounts:');
    accounts.rows.forEach(acc => {
      console.log(`\n--- ${acc.name} (${acc.email_address}) ---`);
      Object.keys(acc).forEach(key => {
        if (acc[key] !== null && acc[key] !== '') {
          console.log(`${key}: ${acc[key]}`);
        }
      });
    });
    
    // Check other email tables
    const emailTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'email%'
      ORDER BY table_name
    `);
    
    console.log('\n📊 All email-related tables:');
    emailTables.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    await db.end();
    console.log('\n✅ Email table structure check completed!');
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    process.exit(1);
  }
}

checkEmailTableStructure();
