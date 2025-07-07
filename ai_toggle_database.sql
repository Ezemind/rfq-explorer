-- AI Toggle Feature Database Update for Bob3.1
-- Create a dedicated AI control table using phone numbers as primary identifiers

-- Create AI control table for phone number-based management
CREATE TABLE IF NOT EXISTS ai_controls (
    phone_number VARCHAR(20) PRIMARY KEY,
    ai_enabled BOOLEAN DEFAULT TRUE,
    ai_disabled_at TIMESTAMP NULL,
    last_human_message_at TIMESTAMP NULL,
    auto_reenable_hours INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_controls_status ON ai_controls(ai_enabled, ai_disabled_at);
CREATE INDEX IF NOT EXISTS idx_ai_controls_reenable ON ai_controls(last_human_message_at, auto_reenable_hours) WHERE ai_enabled = FALSE;

-- Function to get or create AI control record for a phone number
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

-- Function to check if AI can respond (for n8n workflow)
CREATE OR REPLACE FUNCTION can_ai_respond(p_phone_number VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    ai_status BOOLEAN;
    disabled_at TIMESTAMP;
    last_human_at TIMESTAMP;
    reenable_hours INTEGER;
    hours_since_human NUMERIC;
BEGIN
    -- Get AI control record, create if not exists
    SELECT ai_enabled, ai_disabled_at, last_human_message_at, auto_reenable_hours
    INTO ai_status, disabled_at, last_human_at, reenable_hours
    FROM get_or_create_ai_control(p_phone_number);
    
    -- If AI is enabled, return true
    IF ai_status = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- If AI is disabled but no human message timestamp, keep disabled
    IF last_human_at IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if enough time has passed to re-enable
    hours_since_human := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_at)) / 3600;
    
    IF hours_since_human >= reenable_hours THEN
        -- Auto re-enable AI
        UPDATE ai_controls 
        SET ai_enabled = TRUE, 
            ai_disabled_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE phone_number = p_phone_number;
        
        RETURN TRUE;
    END IF;
    
    -- Still within disable period
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to disable AI when human takes over
CREATE OR REPLACE FUNCTION disable_ai_for_human_takeover(p_phone_number VARCHAR(20))
RETURNS BOOLEAN AS $$
BEGIN
    -- Ensure record exists
    PERFORM get_or_create_ai_control(p_phone_number);
    
    -- Disable AI and set timestamps
    UPDATE ai_controls 
    SET ai_enabled = FALSE,
        ai_disabled_at = CURRENT_TIMESTAMP,
        last_human_message_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE phone_number = p_phone_number;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to manually toggle AI status
CREATE OR REPLACE FUNCTION toggle_ai_status(p_phone_number VARCHAR(20), p_enabled BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    -- Ensure record exists
    PERFORM get_or_create_ai_control(p_phone_number);
    
    -- Update AI status
    UPDATE ai_controls 
    SET ai_enabled = p_enabled,
        ai_disabled_at = CASE WHEN p_enabled = FALSE THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
    WHERE phone_number = p_phone_number;
    
    RETURN p_enabled;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk re-enable AI after timeout (for scheduled job)
CREATE OR REPLACE FUNCTION reenable_ai_after_timeout()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE ai_controls 
    SET ai_enabled = TRUE, 
        ai_disabled_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE ai_enabled = FALSE 
    AND last_human_message_at IS NOT NULL
    AND auto_reenable_hours IS NOT NULL
    AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_human_message_at)) / 3600 >= auto_reenable_hours;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-disable AI when human sends message
-- This will work with the chat_messages table
CREATE OR REPLACE FUNCTION auto_disable_ai_on_human_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a human/staff message (not 'customer' which is user, not 'bot' which is AI)
    IF NEW.sender_type IN ('staff', 'human', 'agent') THEN
        -- Disable AI for this phone number
        PERFORM disable_ai_for_human_takeover(NEW.customer_phone);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on chat_messages to auto-disable AI
DROP TRIGGER IF EXISTS auto_disable_ai_trigger ON chat_messages;
CREATE TRIGGER auto_disable_ai_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_disable_ai_on_human_message();

-- Update trigger for ai_controls updated_at
CREATE OR REPLACE FUNCTION update_ai_controls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_controls_updated_at_trigger ON ai_controls;
CREATE TRIGGER update_ai_controls_updated_at_trigger
    BEFORE UPDATE ON ai_controls
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_controls_updated_at();

COMMIT;
