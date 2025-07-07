# AI Toggle Feature Installation Guide for Bob3.1

## Overview
This feature adds AI response control to Bob Explorer (Bob3.1), allowing staff to:
- Toggle AI responses on/off for specific customers (phone numbers)
- Automatically disable AI when a human takes over a conversation
- Auto re-enable AI after a configurable timeout period (default: 3 hours)
- Integration with n8n workflows to check if AI should respond

## Installation Steps

### 1. Database Updates
**IMPORTANT: Run this on your PostgreSQL database FIRST**

Execute the SQL script `ai_toggle_database.sql` on your PostgreSQL database:

```bash
# Using psql command line
psql -h switchback.proxy.rlwy.net -p 27066 -U railway -d railway -f ai_toggle_database.sql

# Or using your preferred PostgreSQL client
# Connect to: switchback.proxy.rlwy.net:27066
# Database: railway
# Username: railway
# Password: ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d
```

### 2. Application Files Updated
The following files have been modified with AI toggle functionality:

**Backend (Electron Main Process):**
- `public/electron.js` - Added AI control IPC handlers
- `public/preload.js` - Added AI control API methods

**Frontend (React Components):**
- `src/components/ui/AIToggleButton.js` - New AI toggle button component
- `src/features/chat/ChatWindow.js` - Added AI toggle button to chat header

### 3. N8N Integration

#### For n8n Workflow - Simple Check
Add a PostgreSQL node in your n8n workflow with this query:

```sql
SELECT can_ai_respond('{{ $node["Webhook"].json["phone_number"] }}') as ai_can_respond;
```

Replace `{{ $node["Webhook"].json["phone_number"] }}` with your actual phone number variable.

#### Example n8n Workflow Structure:
1. **Webhook Trigger** - Receives the WhatsApp message
2. **PostgreSQL Node** - Check AI permission using the query above
3. **IF Node** - Check if `ai_can_respond` is true
   - **True Branch**: Continue with AI response
   - **False Branch**: Skip AI response (end workflow or log)

#### Sample n8n Configuration:
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Check AI Permission",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "query": "SELECT can_ai_respond('{{ $node[\"Webhook\"].json[\"phone_number\"] }}') as ai_can_respond;"
      }
    },
    {
      "name": "Should AI Respond?",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $node['Check AI Permission'].json.ai_can_respond }}",
              "value2": true
            }
          ]
        }
      }
    }
  ]
}
```

### 4. How It Works

#### UI Features:
- **AI Toggle Button**: Added to chat header next to "Customer Details" button
- **Green "AI: ON"**: AI will respond automatically
- **Red "AI: OFF"**: AI responses are disabled
- **Loading State**: Shows spinner while updating status
- **Hover Tooltip**: Shows current AI status

#### Automatic Behavior:
- When a staff member sends ANY message through Bob3.1, AI is automatically disabled
- AI re-enables after 3 hours (configurable) of no human activity
- The system tracks the last human message timestamp
- Database triggers handle the automatic disable functionality

#### Database Functions:
- `can_ai_respond(phone_number)` - Main function for n8n to check AI permission
- `toggle_ai_status(phone_number, enabled)` - Manual toggle AI on/off
- `disable_ai_for_human_takeover(phone_number)` - Auto-disable when human takes over
- `reenable_ai_after_timeout()` - Bulk re-enable after timeout (can be scheduled)

### 5. Testing the Installation

#### Test 1: AI Toggle Button
1. Start the Bob3.1 application
2. Select a customer chat
3. Look for the AI toggle button next to "Customer Details" button
4. Should show green "AI: ON" initially
5. Click to toggle - should turn red "AI: OFF"
6. Check database: 
   ```sql
   SELECT * FROM ai_controls WHERE phone_number = 'YOUR_TEST_NUMBER';
   ```

#### Test 2: N8N Integration
```sql
-- Test with specific phone number
SELECT can_ai_respond('27744203713') as ai_can_respond;
-- Should return: ai_can_respond = true (if AI enabled) or false (if disabled)
```

#### Test 3: Auto-Disable on Human Message
1. Send a message as staff through Bob3.1
2. AI toggle should automatically turn to "AI: OFF"
3. Verify in database:
   ```sql
   SELECT ai_enabled, ai_disabled_at, last_human_message_at 
   FROM ai_controls 
   WHERE phone_number = 'YOUR_NUMBER';
   ```

### 6. Configuration

#### Change AI Re-enable Timeout (default is 3 hours):
```sql
-- Update specific customer timeout to 5 hours
UPDATE ai_controls SET auto_reenable_hours = 5 WHERE phone_number = '27744203713';

-- Update default for new customers
ALTER TABLE ai_controls ALTER COLUMN auto_reenable_hours SET DEFAULT 5;
```

#### Manual AI Control via Database:
```sql
-- Manually enable AI
SELECT toggle_ai_status('27744203713', true);

-- Manually disable AI
SELECT toggle_ai_status('27744203713', false);

-- Check status
SELECT * FROM get_or_create_ai_control('27744203713');
```

### 7. Monitoring

#### Check AI Status for All Customers:
```sql
SELECT 
    phone_number,
    ai_enabled,
    ai_disabled_at,
    last_human_message_at,
    CASE 
        WHEN ai_enabled = FALSE AND last_human_message_at IS NOT NULL THEN 
            ROUND(auto_reenable_hours - (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_message_at)) / 3600), 2)
        ELSE NULL
    END as hours_until_reenable
FROM ai_controls 
ORDER BY ai_disabled_at DESC NULLS LAST;
```

#### Manually Re-enable AI for Overdue Customers:
```sql
SELECT reenable_ai_after_timeout() as customers_reenabled;
```

### 8. Troubleshooting

#### AI Toggle Button Not Showing:
- Check browser console for JavaScript errors in Bob3.1
- Ensure all files are properly updated
- Restart the Electron application
- Verify `AIToggleButton.js` component was created correctly

#### Database Errors:
- Ensure `ai_toggle_database.sql` ran successfully without errors
- Check PostgreSQL logs for any trigger issues
- Verify table `ai_controls` exists: `\dt ai_controls`
- Test functions: `SELECT can_ai_respond('test123');`

#### N8N Not Respecting AI Status:
- Test the SQL query directly in database management tool
- Check n8n workflow configuration and connection to database
- Verify phone number format consistency (should be without + sign)
- Enable n8n workflow debugging to see query results

#### Auto-Disable Not Working:
- Check that messages are being inserted with `sender_type = 'staff'`
- Verify database trigger exists: 
  ```sql
  SELECT * FROM information_schema.triggers WHERE trigger_name = 'auto_disable_ai_trigger';
  ```
- Test trigger manually:
  ```sql
  INSERT INTO chat_messages (session_id, customer_phone, message_text, sender_type, created_at) 
  VALUES (1, '27744203713', 'test message', 'staff', NOW());
  ```

### 9. Phone Number Format
Ensure consistent phone number format across all systems:
- n8n webhook: `27744203713` (no + sign, no spaces)
- Database: `27744203713` (no + sign, no spaces)  
- Bob3.1: handles formatting automatically

### 10. Security Notes
- AI control is per phone number, not per user session
- Staff members can toggle AI for any customer they have access to
- No additional authentication required (inherits app authentication)
- Database triggers ensure automatic disable on human intervention
- All AI control actions are logged with timestamps

## Development Notes

### Architecture:
- **Frontend**: React component with real-time status updates
- **Backend**: Electron IPC handlers for database communication
- **Database**: PostgreSQL functions and triggers for automation
- **Integration**: Simple SQL query for n8n workflow integration

### Performance:
- AI status checks are fast database function calls
- Automatic triggers run only on new message inserts
- No polling or background jobs required for basic functionality
- Optional: Set up scheduled job to run `reenable_ai_after_timeout()` periodically

## Summary
Once installed, the AI toggle provides complete control over when AI responds to customers, with automatic handling when humans take over conversations and configurable timeouts for re-enabling AI responses. The feature is fully integrated into the Bob3.1 interface and provides seamless n8n workflow integration.
