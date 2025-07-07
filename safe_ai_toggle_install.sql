-- Safe AI Toggle Feature Installation for Bob3.1 PostgreSQL Database
-- This script will ONLY ADD new functionality and will NOT modify existing tables

-- First, let's check if we're connected to the right database
-- This should show existing Bob3.1 tables like chat_messages, customers, etc.

-- Step 1: Create AI control table ONLY if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_controls (
    phone_number VARCHAR(20) PRIMARY KEY,
    ai_enabled BOOLEAN DEFAULT TRUE,
    ai_disabled_at TIMESTAMP NULL,
    last_human_message_at TIMESTAMP NULL,
    auto_reenable_hours INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_ai_controls_status ON ai_controls(ai_enabled, ai_disabled_at);
CREATE INDEX IF NOT EXISTS idx_ai_controls_reenable ON ai_controls(last_human_message_at, auto_reenable_hours) WHERE ai_enabled = FALSE;

-- Step 3: Create functions (OR REPLACE is safe - won't affect data)
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

-- Step 4: Create trigger function (OR REPLACE is safe)
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

-- Step 5: Create triggers ONLY if they don't exist
-- We need to check for existing triggers first
DO $$
BEGIN
    -- Check if trigger exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'auto_disable_ai_trigger' 
        AND event_object_table = 'chat_messages'
    ) THEN
        CREATE TRIGGER auto_disable_ai_trigger
            AFTER INSERT ON chat_messages
            FOR EACH ROW
            EXECUTE FUNCTION auto_disable_ai_on_human_message();
    END IF;
END $$;

-- Step 6: Create updated_at trigger for ai_controls
CREATE OR REPLACE FUNCTION update_ai_controls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Check if trigger exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_ai_controls_updated_at_trigger' 
        AND event_object_table = 'ai_controls'
    ) THEN
        CREATE TRIGGER update_ai_controls_updated_at_trigger
            BEFORE UPDATE ON ai_controls
            FOR EACH ROW
            EXECUTE FUNCTION update_ai_controls_updated_at();
    END IF;
END $$;

-- Step 7: Test that everything works
SELECT 'AI Toggle installation complete!' as status;

-- Verify the functions work
SELECT can_ai_respond('test123') as test_result;
