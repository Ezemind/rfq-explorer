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

async function investigateMedia() {
  const db = new Pool(dbConfig);
  
  try {
    console.log('🔍 INVESTIGATING MEDIA MESSAGES\n');
    
    // 1. Find the "707" message specifically
    console.log('📱 FINDING "707" MESSAGE:');
    const message707 = await db.query(`
      SELECT id, session_id, sender_type, message_type, message_text, media_url, media_type, media_filename, created_at
      FROM chat_messages 
      WHERE message_text LIKE '%707%'
      ORDER BY created_at DESC
    `);
    console.log(`Found ${message707.rows.length} messages with "707"`);
    message707.rows.forEach((msg, i) => {
      console.log(`\n  Message ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Session: ${msg.session_id}`);
      console.log(`    Sender: ${msg.sender_type}`);
      console.log(`    Type: ${msg.message_type}`);
      console.log(`    Text: ${msg.message_text}`);
      console.log(`    Media URL: ${msg.media_url}`);
      console.log(`    Media Type: ${msg.media_type}`);
      console.log(`    Media Filename: ${msg.media_filename}`);
      console.log(`    Created: ${msg.created_at}`);
    });
    
    // 2. Check all messages from session 4 (most active session)
    console.log('\n💬 ALL MESSAGES FROM SESSION 4:');
    const session4Messages = await db.query(`
      SELECT id, sender_type, message_type, message_text, media_url, media_type, created_at
      FROM chat_messages 
      WHERE session_id = 4
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log(`Found ${session4Messages.rows.length} messages in session 4`);
    session4Messages.rows.forEach((msg, i) => {
      console.log(`\n  Message ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Sender: ${msg.sender_type}`);
      console.log(`    Type: ${msg.message_type}`);
      console.log(`    Text: ${msg.message_text?.substring(0, 30)}...`);
      console.log(`    Media URL: ${msg.media_url}`);
      console.log(`    Media Type: ${msg.media_type}`);
      console.log(`    Has Media: ${msg.media_url ? 'YES' : 'NO'}`);
    });
    
    // 3. Check specifically for audio messages
    console.log('\n🎵 AUDIO MESSAGES:');
    const audioMessages = await db.query(`
      SELECT id, session_id, sender_type, message_text, media_url, media_type, media_filename, created_at
      FROM chat_messages 
      WHERE message_type = 'audio' OR media_type = 'audio'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Found ${audioMessages.rows.length} audio messages`);
    audioMessages.rows.forEach((msg, i) => {
      console.log(`\n  Audio ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Session: ${msg.session_id}`);
      console.log(`    Text: ${msg.message_text}`);
      console.log(`    Media URL: ${msg.media_url}`);
      console.log(`    Media Type: ${msg.media_type}`);
      console.log(`    Filename: ${msg.media_filename}`);
    });
    
    // 4. Check image messages
    console.log('\n🖼️ IMAGE MESSAGES:');
    const imageMessages = await db.query(`
      SELECT id, session_id, sender_type, message_text, media_url, media_type, media_filename, created_at
      FROM chat_messages 
      WHERE message_type = 'image' OR media_type = 'image'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Found ${imageMessages.rows.length} image messages`);
    imageMessages.rows.forEach((msg, i) => {
      console.log(`\n  Image ${i + 1}:`);
      console.log(`    ID: ${msg.id}`);
      console.log(`    Session: ${msg.session_id}`);
      console.log(`    Text: ${msg.message_text}`);
      console.log(`    Media URL: ${msg.media_url}`);
      console.log(`    Media Type: ${msg.media_type}`);
      console.log(`    Filename: ${msg.media_filename}`);
    });
    
    // 5. Test if media URLs are accessible
    console.log('\n🔗 TESTING MEDIA URL ACCESSIBILITY:');
    const testUrls = [
      'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1048408267398810&ext=1751121593&hash=ARlgLAXVsF3gyqZokIacAsM-H548oqnxIvb0rGcZjHi2aA',
      'media/audio/64_1751112035835.ogg',
      'media/images/62_1751112037234.jpg'
    ];
    
    for (const url of testUrls) {
      console.log(`\n  Testing: ${url}`);
      if (url.startsWith('http')) {
        console.log(`    Type: External URL (Facebook)`);
        console.log(`    Status: Should work directly`);
      } else {
        console.log(`    Type: Local Railway path`);
        console.log(`    Full URL: https://bob-explorer-webhook-production.up.railway.app/${url}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Investigation error:', error);
  } finally {
    await db.end();
  }
}

investigateMedia();
