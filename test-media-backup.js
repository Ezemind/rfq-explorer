const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function testMediaBackupSystem() {
  try {
    console.log('🧪 Testing media backup system...');
    
    // Get a recent media message
    const mediaMessages = await pool.query(`
      SELECT id, message_type, media_url, customer_phone, created_at 
      FROM chat_messages 
      WHERE media_url IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (mediaMessages.rows.length === 0) {
      console.log('❌ No media messages found to test');
      return;
    }
    
    const message = mediaMessages.rows[0];
    console.log('📱 Testing with message:', {
      id: message.id,
      type: message.message_type,
      url: message.media_url,
      customer: message.customer_phone
    });
    
    // Test Railway URL construction
    const railwayUrl = `https://bob-explorer-webhook-production.up.railway.app${message.media_url}`;
    console.log('🔗 Railway URL:', railwayUrl);
    
    // Test Railway accessibility
    try {
      const response = await axios.head(railwayUrl, { timeout: 5000 });
      console.log('✅ Railway URL accessible:', response.status);
    } catch (error) {
      console.log('❌ Railway URL not accessible:', error.message);
    }
    
    // Simulate Google Drive backup process
    console.log('☁️ Google Drive backup simulation:');
    const customerFolder = `Bob Explorer/${message.customer_phone}`;
    const filename = `${message.message_type}_${Date.now()}_${message.customer_phone}.jpg`;
    console.log('  📁 Target folder:', customerFolder);
    console.log('  📄 Filename:', filename);
    
    // Update message with backup URL simulation
    const mockDriveUrl = `https://drive.google.com/uc?id=backup_${Date.now()}&export=download`;
    await pool.query(`
      UPDATE chat_messages 
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'), 
        '{google_drive_backup}', 
        $1::jsonb
      )
      WHERE id = $2
    `, [JSON.stringify({ 
      url: mockDriveUrl, 
      filename: filename,
      backup_created: new Date().toISOString(),
      folder: customerFolder
    }), message.id]);
    
    console.log('✅ Database updated with backup info');
    
    // Verify the update
    const updatedMessage = await pool.query('SELECT metadata FROM chat_messages WHERE id = $1', [message.id]);
    console.log('📊 Updated metadata:', JSON.stringify(updatedMessage.rows[0].metadata, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing backup system:', error);
  } finally {
    await pool.end();
  }
}

testMediaBackupSystem();
