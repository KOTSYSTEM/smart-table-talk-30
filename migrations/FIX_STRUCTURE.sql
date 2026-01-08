-- =====================================================
-- STEP 1: FIX DATABASE STRUCTURE (Run this first)
-- =====================================================

-- Add missing columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add missing columns to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT true;

-- Add missing columns to orders if any
ALTER TABLE orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Ensure RLS is disabled properly
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'Structure Fixed' as status;
