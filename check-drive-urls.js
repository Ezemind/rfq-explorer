const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function checkGoogleDriveUrls() {
  try {
    console.log('🔍 Checking actual Google Drive URLs in database...');
    
    const messages = await pool.query(`
      SELECT id, message_type, media_url, sender_type 
      FROM chat_messages 
      WHERE media_url LIKE '%drive.google.com%'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Google Drive messages found:', messages.rows.length);
    messages.rows.forEach(msg => {
      console.log(`\nMessage ID ${msg.id} (${msg.message_type}):`);
      console.log('URL:', msg.media_url);
      
      // Extract file ID if present
      const fileIdMatch = msg.media_url.match(/[?&]id=([^&]+)/);
      if (fileIdMatch) {
        console.log('File ID:', fileIdMatch[1]);
      }
    });
    
    console.log('\n💡 Solution for Google Drive audio playback:');
    console.log('The Google Drive URLs in your database need to be the direct download links');
    console.log('that work with the Bob Explorer app audio player.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkGoogleDriveUrls();
