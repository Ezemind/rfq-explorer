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

async function fixEmailTemplates() {
  try {
    console.log('🔧 Fixing email template issues...');
    
    // Check current email templates
    const templates = await db.query(`
      SELECT id, name, template_type, subject, body_html, body_text, is_active
      FROM email_templates 
      ORDER BY template_type, name
    `);
    
    console.log(`\n📋 Current email templates (${templates.rows.length} total):`);
    const templateGroups = {};
    
    templates.rows.forEach(template => {
      const key = `${template.template_type}-${template.name}`;
      if (!templateGroups[key]) {
        templateGroups[key] = [];
      }
      templateGroups[key].push(template);
    });
    
    // Find duplicates
    const duplicates = [];
    const unique = [];
    
    Object.entries(templateGroups).forEach(([key, templates]) => {
      if (templates.length > 1) {
        console.log(`\n❌ DUPLICATE: ${key} (${templates.length} copies)`);
        templates.forEach((tmpl, index) => {
          console.log(`   ${index + 1}. ID: ${tmpl.id}, Active: ${tmpl.is_active}`);
        });
        
        // Keep the first active one, mark others for deletion
        const activeTemplate = templates.find(t => t.is_active) || templates[0];
        unique.push(activeTemplate);
        
        templates.forEach(tmpl => {
          if (tmpl.id !== activeTemplate.id) {
            duplicates.push(tmpl.id);
          }
        });
      } else {
        console.log(`✅ UNIQUE: ${key}`);
        unique.push(templates[0]);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`- Unique templates: ${unique.length}`);
    console.log(`- Duplicates to remove: ${duplicates.length}`);
    
    // Remove duplicates
    if (duplicates.length > 0) {
      const deleteResult = await db.query(`
        DELETE FROM email_templates 
        WHERE id = ANY($1)
      `, [duplicates]);
      
      console.log(`✅ Deleted ${deleteResult.rowCount} duplicate templates`);
    }
    
    // Update remaining templates to ensure they have proper placeholders
    console.log('\n🔧 Updating templates with smart placeholders...');
    
    for (const template of unique) {
      let updatedSubject = template.subject;
      let updatedBody = template.body_html || template.body_text || '';
      
      // Add customer_name placeholder if missing
      if (!updatedSubject.includes('{customer_name}') && template.template_type === 'followup') {
        updatedSubject = updatedSubject.replace('Follow-up', 'Follow-up for {customer_name}');
      }
      
      // Add placeholders to body if missing
      if (!updatedBody.includes('{customer_name}')) {
        updatedBody = `Dear {customer_name},\n\n${updatedBody}`;
      }
      
      // Add product context for follow-ups
      if (template.template_type === 'followup' && !updatedBody.includes('{product_list}')) {
        updatedBody = updatedBody.replace(
          'inquiry', 
          'inquiry about {product_list}'
        );
      }
      
      // Add company context
      if (!updatedBody.includes('{company_name}') && updatedBody.includes('company')) {
        updatedBody = updatedBody.replace('company', '{company_name}');
      }
      
      // Convert to HTML if needed
      if (!updatedBody.includes('<p>') && updatedBody.includes('\n')) {
        updatedBody = updatedBody
          .split('\n')
          .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
          .join('');
      }
      
      // Update the template
      await db.query(`
        UPDATE email_templates 
        SET subject = $1, body_html = $2, body_text = $3
        WHERE id = $4
      `, [updatedSubject, updatedBody, updatedBody.replace(/<[^>]*>/g, ''), template.id]);
      
      console.log(`✅ Updated template: ${template.name}`);
      console.log(`   Subject: ${updatedSubject}`);
      console.log(`   Body preview: ${updatedBody.substring(0, 100)}...`);
    }
    
    // Show final clean template list
    const finalTemplates = await db.query(`
      SELECT id, name, template_type, subject, body_html
      FROM email_templates 
      WHERE is_active = true
      ORDER BY template_type, name
    `);
    
    console.log(`\n📋 Final clean template list (${finalTemplates.rows.length} templates):`);
    finalTemplates.rows.forEach((tmpl, index) => {
      console.log(`${index + 1}. [${tmpl.template_type}] ${tmpl.name}`);
      console.log(`   Subject: ${tmpl.subject}`);
      
      // Check for placeholders
      const placeholders = [];
      const content = `${tmpl.subject} ${tmpl.body_html}`;
      const matches = content.match(/{[^}]+}/g);
      if (matches) {
        placeholders.push(...matches);
      }
      
      if (placeholders.length > 0) {
        console.log(`   Placeholders: ${[...new Set(placeholders)].join(', ')}`);
      } else {
        console.log(`   ⚠️ No placeholders found`);
      }
    });
    
    await db.end();
    console.log('\n✅ Email template cleanup completed!');
    console.log('\n🔄 Refresh the compose modal to see:');
    console.log('1. No duplicate templates');
    console.log('2. Smart placeholders in templates');
    console.log('3. Proper variable substitution');
  } catch (error) {
    console.error('❌ Error fixing email templates:', error.message);
    process.exit(1);
  }
}

fixEmailTemplates();
