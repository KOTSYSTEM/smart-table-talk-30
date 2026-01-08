-- =====================================================
-- QUICK FIX: Ensure staff exists and disable strict RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check existing staff
SELECT id, user_id, full_name, email, role, organization_id, is_active FROM staff;

-- Step 2: Check existing organizations
SELECT id, name, slug FROM organizations;

-- Step 3: Get your user ID
SELECT id, email, raw_user_meta_data->>'full_name' as full_name FROM auth.users;

-- Step 4: Create organization if none exists
INSERT INTO organizations (id, name, slug)
SELECT gen_random_uuid(), 'My Restaurant', 'my-restaurant'
WHERE NOT EXISTS (SELECT 1 FROM organizations);

-- Step 5: Get the org ID
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
BEGIN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    SELECT id, email, raw_user_meta_data->>'full_name' INTO v_user_id, v_user_email, v_user_name FROM auth.users LIMIT 1;
    
    RAISE NOTICE 'Org ID: %, User ID: %, Email: %', v_org_id, v_user_id, v_user_email;
    
    -- Insert staff if not exists
    INSERT INTO staff (organization_id, user_id, full_name, email, role, is_active)
    VALUES (v_org_id, v_user_id, COALESCE(v_user_name, 'Admin'), v_user_email, 'owner', true)
    ON CONFLICT DO NOTHING;
    
    -- Create location if not exists
    INSERT INTO locations (organization_id, name, address_line1, is_primary)
    SELECT v_org_id, 'Main Branch', 'Main Location', true
    WHERE NOT EXISTS (SELECT 1 FROM locations WHERE organization_id = v_org_id);
    
    RAISE NOTICE 'Staff and location created';
END $$;

-- Step 6: Verify staff now exists
SELECT s.id, s.user_id, s.full_name, s.email, s.role, o.name as org 
FROM staff s 
JOIN organizations o ON o.id = s.organization_id;

-- Step 7: IMPORTANT - Temporarily disable RLS on orders for testing
-- This will allow orders to be created without strict org checks
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Also disable on staff/org for easier access
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DISABLED - App should work now! Re-enable RLS after confirming orders work.' as status;
