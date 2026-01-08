-- =====================================================
-- Create 40 Tables with Sections
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, get the organization ID
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found. Please create one first.';
    END IF;
    
    -- Delete existing tables (optional - comment out if you want to keep them)
    DELETE FROM restaurant_tables WHERE organization_id = v_org_id;
    
    -- Bar Area (1st Floor) - Tables B1 to B20
    FOR i IN 1..20 LOOP
        INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
        VALUES (v_org_id, i, 'Bar Area (1st Floor)', 4, 'free');
    END LOOP;
    
    -- Family Section (2nd Floor) - Tables F1 to F10
    FOR i IN 1..10 LOOP
        INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
        VALUES (v_org_id, 20 + i, 'Family Section (2nd Floor)', 6, 'free');
    END LOOP;
    
    -- DJ Area (2nd Floor) - Tables D1 to D10
    FOR i IN 1..10 LOOP
        INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
        VALUES (v_org_id, 30 + i, 'DJ Area (2nd Floor)', 4, 'free');
    END LOOP;
    
    RAISE NOTICE 'Created 40 tables successfully!';
END $$;

-- Verify tables created
SELECT 
    section,
    COUNT(*) as table_count,
    array_agg(number ORDER BY number) as table_numbers
FROM restaurant_tables
GROUP BY section
ORDER BY section;

-- Show all tables
SELECT number, section, capacity, status FROM restaurant_tables ORDER BY number;
