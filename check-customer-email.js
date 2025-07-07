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

async function checkCustomer() {
  const result = await db.query(`SELECT id, name, email, phone FROM customers WHERE email = 'pieter@mcmco.co.za'`);
  
  console.log('Customer for pieter@mcmco.co.za:');
  if (result.rows.length > 0) {
    console.log('ID:', result.rows[0].id);
    console.log('Name:', result.rows[0].name);
    console.log('Phone:', result.rows[0].phone);
  } else {
    console.log('No customer found');
  }
  
  await db.end();
}

checkCustomer().catch(console.error);
