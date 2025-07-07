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

async function checkEmailTables() {
  try {
    const result = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'email%'
      ORDER BY table_name
    `);
    
    console.log('Email tables found:');
    result.rows.forEach(row => console.log('- ' + row.table_name));
    
    const templateCount = await db.query('SELECT COUNT(*) FROM email_templates');
    console.log('Email templates count:', templateCount.rows[0].count);
    
    const accountCount = await db.query('SELECT COUNT(*) FROM email_accounts');
    console.log('Email accounts count:', accountCount.rows[0].count);
    
    await db.end();
    console.log('Database check completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkEmailTables();
