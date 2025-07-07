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

async function fixTemplateVariables() {
  try {
    console.log('🔧 Fixing email template variables format...');

    // Get all templates with invalid JSON variables
    const templates = await db.query('SELECT id, name, variables FROM email_templates');
    
    for (const template of templates.rows) {
      console.log(`\nProcessing template: ${template.name}`);
      console.log(`Current variables: ${template.variables}`);
      
      let fixedVariables;
      try {
        // Try to parse as JSON first
        JSON.parse(template.variables);
        console.log('  ✅ Already valid JSON, skipping');
        continue;
      } catch (error) {
        // Convert comma-separated string to JSON array
        if (typeof template.variables === 'string' && template.variables.includes(',')) {
          const variableArray = template.variables.split(',').map(v => v.trim());
          fixedVariables = JSON.stringify(variableArray);
        } else if (typeof template.variables === 'string') {
          // Single variable
          fixedVariables = JSON.stringify([template.variables.trim()]);
        } else {
          // Default empty array
          fixedVariables = JSON.stringify([]);
        }
      }
      
      console.log(`  Fixed variables: ${fixedVariables}`);
      
      // Update the template
      await db.query(
        'UPDATE email_templates SET variables = $1 WHERE id = $2',
        [fixedVariables, template.id]
      );
      
      console.log('  ✅ Updated successfully');
    }

    console.log('\n🎉 Template variables fixed successfully!');
    
    // Verify the fix
    console.log('\n🧪 Verifying fix...');
    const verifyResult = await db.query('SELECT name, variables FROM email_templates');
    
    for (const template of verifyResult.rows) {
      try {
        const parsed = JSON.parse(template.variables);
        console.log(`✅ ${template.name}: ${parsed.join(', ')}`);
      } catch (error) {
        console.log(`❌ ${template.name}: Still invalid JSON`);
      }
    }

  } catch (error) {
    console.error('❌ Error fixing template variables:', error);
  } finally {
    await db.end();
  }
}

fixTemplateVariables();
