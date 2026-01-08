-- =====================================================
-- FIX: Create staff record for existing user
-- Run this in Supabase SQL Editor to fix RLS issues
-- =====================================================

-- First, let's see what organizations exist
SELECT id, name, slug FROM organizations;

-- Get the first organization ID and create staff
DO $$
DECLARE
    v_org_id UUID;
    v_location_id UUID;
BEGIN
    -- Get the first organization
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        -- Create a default organization if none exists
        INSERT INTO organizations (id, name, slug)
        VALUES (gen_random_uuid(), 'My Restaurant', 'my-restaurant')
        RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Created organization: %', v_org_id;
    END IF;
    
    -- Get or create a default location
    SELECT id INTO v_location_id FROM locations WHERE organization_id = v_org_id LIMIT 1;
    
    IF v_location_id IS NULL THEN
        INSERT INTO locations (organization_id, name, address_line1, is_primary)
        VALUES (v_org_id, 'Main Branch', '123 Restaurant St', true)
        RETURNING id INTO v_location_id;
        
        RAISE NOTICE 'Created default location: %', v_location_id;
    END IF;
    
    -- Create staff records for all authenticated users who don't have one
    INSERT INTO staff (organization_id, user_id, full_name, email, role, is_active)
    SELECT 
        v_org_id,
        au.id,
        COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
        au.email,
        'owner',
        true
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM staff s WHERE s.user_id = au.id
    );
    
    RAISE NOTICE 'Staff records created for all users';
    
    -- Update categories to have organization_id
    UPDATE categories SET organization_id = v_org_id WHERE organization_id IS NULL;
    
    -- Update menu_items to have organization_id
    UPDATE menu_items SET organization_id = v_org_id WHERE organization_id IS NULL;
    
    -- Update customers to have organization_id
    UPDATE customers SET organization_id = v_org_id WHERE organization_id IS NULL;
    
    -- Update tables if exists (check for both names)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables') THEN
        EXECUTE 'UPDATE restaurant_tables SET organization_id = $1 WHERE organization_id IS NULL' USING v_org_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
        EXECUTE 'UPDATE tables SET organization_id = $1 WHERE organization_id IS NULL' USING v_org_id;
    END IF;
    
    RAISE NOTICE 'All records updated with organization_id: %', v_org_id;
END $$;

-- Verify staff records
SELECT s.id, s.full_name, s.email, s.role, o.name as org_name
FROM staff s
JOIN organizations o ON o.id = s.organization_id;

-- Fix orders RLS policy - make it more permissive for staff
DROP POLICY IF EXISTS "Staff can create orders" ON orders;
CREATE POLICY "Staff can create orders" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Staff can view orders" ON orders;
CREATE POLICY "Staff can view orders" ON orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Staff can update orders" ON orders;
CREATE POLICY "Staff can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Same for order_items
DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;
CREATE POLICY "Staff can manage order items" ON order_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Allow staff to read organizations
DROP POLICY IF EXISTS "Staff can read organizations" ON organizations;
CREATE POLICY "Staff can read organizations" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
        OR
        EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Done!
SELECT 'RLS FIX COMPLETE! Staff records created and policies updated.' as status;
