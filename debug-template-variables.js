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

async function debugTemplateVariables() {
  try {
    console.log('🔍 Debugging template variables...');

    const templates = await db.query('SELECT id, name, variables FROM email_templates');
    
    for (const template of templates.rows) {
      console.log(`\n--- Template: ${template.name} ---`);
      console.log('Raw variables:', template.variables);
      console.log('Type:', typeof template.variables);
      console.log('Length:', template.variables ? template.variables.length : 'null');
      
      if (template.variables) {
        console.log('First 50 chars:', JSON.stringify(template.variables.substring(0, 50)));
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(template.variables);
          console.log('✅ Valid JSON:', parsed);
        } catch (error) {
          console.log('❌ JSON Parse Error:', error.message);
          
          // If it contains commas, split and convert
          if (template.variables.includes(',')) {
            const splits = template.variables.split(',').map(v => v.trim());
            console.log('Split result:', splits);
            const jsonArray = JSON.stringify(splits);
            console.log('Would convert to:', jsonArray);
            
            // Actually update it
            await db.query(
              'UPDATE email_templates SET variables = $1 WHERE id = $2',
              [jsonArray, template.id]
            );
            console.log('✅ Updated!');
          }
        }
      }
    }

    console.log('\n🔄 Re-checking after updates...');
    const updatedTemplates = await db.query('SELECT name, variables FROM email_templates');
    
    for (const template of updatedTemplates.rows) {
      console.log(`\n${template.name}:`);
      console.log('  Raw:', template.variables);
      try {
        const parsed = JSON.parse(template.variables);
        console.log('  ✅ Parsed:', parsed);
      } catch (error) {
        console.log('  ❌ Still invalid:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

debugTemplateVariables();
