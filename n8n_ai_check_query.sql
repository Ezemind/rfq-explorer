-- N8N Workflow Query: Check if AI can respond to a phone number
-- Use this query in your n8n workflow to determine if AI should respond

-- Simple query for n8n workflow:
-- Replace {{ $node["Webhook"].json["phone_number"] }} with your actual phone number variable

SELECT can_ai_respond('{{ $node["Webhook"].json["phone_number"] }}') as ai_can_respond;

-- Alternative detailed query that gives you more information:
SELECT 
    phone_number,
    ai_enabled,
    ai_disabled_at,
    last_human_message_at,
    auto_reenable_hours,
    CASE 
        WHEN ai_enabled = TRUE THEN TRUE
        WHEN last_human_message_at IS NULL THEN FALSE
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_message_at)) / 3600 >= auto_reenable_hours THEN TRUE
        ELSE FALSE
    END as can_respond,
    CASE 
        WHEN ai_enabled = FALSE AND last_human_message_at IS NOT NULL THEN 
            ROUND(auto_reenable_hours - (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_message_at)) / 3600), 2)
        ELSE NULL
    END as hours_until_reenable
FROM get_or_create_ai_control('{{ $node["Webhook"].json["phone_number"] }}');

-- Example usage with specific phone number (for testing):
-- SELECT can_ai_respond('27744203713') as ai_can_respond;

-- Batch query to check multiple phone numbers:
-- SELECT phone_number, can_ai_respond(phone_number) as ai_can_respond 
-- FROM unnest(ARRAY['27744203713', '27821234567']) as phone_number;
