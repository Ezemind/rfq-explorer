-- Fix missing get_or_create_ai_control function
-- This function should return the AI control record for a phone number, creating it if it doesn't exist

CREATE OR REPLACE FUNCTION get_or_create_ai_control(p_phone_number VARCHAR(20))
RETURNS TABLE(phone_number VARCHAR(20), ai_enabled BOOLEAN, ai_disabled_at TIMESTAMP, last_human_message_at TIMESTAMP, auto_reenable_hours INTEGER) AS $$
BEGIN
    -- Insert if not exists, return existing or new record
    INSERT INTO ai_controls (phone_number, ai_enabled, auto_reenable_hours)
    VALUES (p_phone_number, TRUE, 3)
    ON CONFLICT (phone_number) DO NOTHING;
    
    RETURN QUERY
    SELECT ac.phone_number, ac.ai_enabled, ac.ai_disabled_at, ac.last_human_message_at, ac.auto_reenable_hours
    FROM ai_controls ac
    WHERE ac.phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;
