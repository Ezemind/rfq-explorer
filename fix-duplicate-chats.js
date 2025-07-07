const { Pool } = require('pg');

const pool = new Pool({
  user: 'railway',
  host: 'switchback.proxy.rlwy.net',
  database: 'railway',
  password: 'ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d',
  port: 27066,
  ssl: { rejectUnauthorized: false }
});

async function fixDuplicateChats() {
  try {
    console.log('🔧 Fixing duplicate chat sessions - consolidating by phone number...');
    
    // Find all customers with multiple chat sessions
    const duplicateSessions = await pool.query(`
      SELECT customer_phone, COUNT(*) as session_count, 
             array_agg(id ORDER BY created_at ASC) as session_ids,
             array_agg(last_message_at ORDER BY created_at ASC) as last_message_times
      FROM chat_sessions 
      GROUP BY customer_phone 
      HAVING COUNT(*) > 1
    `);
    
    console.log(`Found ${duplicateSessions.rows.length} customers with duplicate sessions`);
    
    for (const customer of duplicateSessions.rows) {
      console.log(`\n👤 Fixing customer: ${customer.customer_phone}`);
      console.log(`   Sessions to merge: ${customer.session_ids}`);
      
      // Keep the first (oldest) session as the primary one
      const primarySessionId = customer.session_ids[0];
      const sessionsToMerge = customer.session_ids.slice(1);
      
      console.log(`   Primary session: ${primarySessionId}`);
      console.log(`   Sessions to merge: ${sessionsToMerge}`);
      
      // Move all messages from duplicate sessions to the primary session
      for (const sessionId of sessionsToMerge) {
        const moveResult = await pool.query(`
          UPDATE chat_messages 
          SET session_id = $1 
          WHERE session_id = $2
        `, [primarySessionId, sessionId]);
        
        console.log(`   ✅ Moved ${moveResult.rowCount} messages from session ${sessionId} to ${primarySessionId}`);
      }
      
      // Update primary session with latest message time
      const latestTime = customer.last_message_times.reduce((latest, time) => {
        return new Date(time) > new Date(latest) ? time : latest;
      });
      
      await pool.query(`
        UPDATE chat_sessions 
        SET last_message_at = $1, updated_at = NOW()
        WHERE id = $2
      `, [latestTime, primarySessionId]);
      
      console.log(`   ✅ Updated primary session with latest time: ${latestTime}`);
      
      // Delete the duplicate sessions
      for (const sessionId of sessionsToMerge) {
        await pool.query('DELETE FROM chat_sessions WHERE id = $1', [sessionId]);
        console.log(`   ✅ Deleted duplicate session ${sessionId}`);
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verification - checking for remaining duplicates...');
    const remainingDuplicates = await pool.query(`
      SELECT customer_phone, COUNT(*) as session_count
      FROM chat_sessions 
      GROUP BY customer_phone 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.rows.length === 0) {
      console.log('✅ SUCCESS: No duplicate sessions remaining');
    } else {
      console.log('❌ WARNING: Still have duplicates:', remainingDuplicates.rows);
    }
    
    // Show final session summary
    const finalSessions = await pool.query(`
      SELECT cs.customer_phone, c.name, cs.id, cs.last_message_at,
             COUNT(cm.id) as message_count
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_phone = c.phone
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      GROUP BY cs.customer_phone, c.name, cs.id, cs.last_message_at
      ORDER BY cs.last_message_at DESC
    `);
    
    console.log('\n📋 Final chat sessions:');
    finalSessions.rows.forEach(session => {
      console.log(`- ${session.name || session.customer_phone}: ${session.message_count} messages (Last: ${session.last_message_at})`);
    });
    
    console.log('\n🎉 Chat consolidation complete! Each customer now has only one chat session.');
    
  } catch (error) {
    console.error('❌ Error fixing duplicate chats:', error);
  } finally {
    await pool.end();
  }
}

fixDuplicateChats();
