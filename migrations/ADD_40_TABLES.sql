-- =====================================================
-- SIMPLE FIX - Run each statement separately if needed
-- =====================================================

-- 1. Check what's in restaurant_tables now:
SELECT id, number, section FROM restaurant_tables ORDER BY number LIMIT 10;

-- 2. Count existing tables:
SELECT COUNT(*) as current_count FROM restaurant_tables;

-- 3. Get organization ID:
SELECT id as org_id FROM organizations LIMIT 1;

-- 4. DELETE ALL existing tables (copy org_id from step 3):
-- DELETE FROM restaurant_tables WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 5. Insert 40 tables manually (replace ORG_ID with your organization ID from step 3):
/*
-- Bar Area (1st Floor) - 20 tables
INSERT INTO restaurant_tables (organization_id, number, section, capacity, status) VALUES
('ORG_ID', 1, 'Bar Area (1st Floor)', 4, 'free'),
('ORG_ID', 2, 'Bar Area (1st Floor)', 4, 'free'),
... etc
*/

-- AUTOMATED VERSION - Just run this:
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Get org ID
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    RAISE NOTICE 'Organization ID: %', v_org_id;
    RAISE NOTICE 'Existing tables count: %', (SELECT COUNT(*) FROM restaurant_tables);
    
    -- Delete ALL existing tables for this org
    DELETE FROM restaurant_tables;
    
    RAISE NOTICE 'Deleted existing tables';
    
    -- Insert Bar Area tables (1-20)
    INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
    SELECT v_org_id, generate_series, 'Bar Area (1st Floor)', 4, 'free'
    FROM generate_series(1, 20);
    
    -- Insert Family Section tables (21-30)
    INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
    SELECT v_org_id, generate_series, 'Family Section (2nd Floor)', 6, 'free'
    FROM generate_series(21, 30);
    
    -- Insert DJ Area tables (31-40)
    INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
    SELECT v_org_id, generate_series, 'DJ Area (2nd Floor)', 4, 'free'
    FROM generate_series(31, 40);
    
    RAISE NOTICE 'Created 40 tables!';
END $$;

-- 6. Verify the result:
SELECT section, COUNT(*) as count FROM restaurant_tables GROUP BY section ORDER BY section;
SELECT COUNT(*) as total FROM restaurant_tables;
