-- =====================================================
-- CLEANUP: Remove Demo Data
-- Run this to clean out test/demo data
-- =====================================================

-- Delete demo organization data (optional - only run if you want a clean slate)
-- This will cascade delete all related data

-- First, let's keep the organization but clean the sample data names
UPDATE organizations 
SET name = 'My Restaurant',
    slug = 'my-restaurant'
WHERE slug = 'demo-restaurant';

-- Clean up any test menu items (keeping the structure)
-- DELETE FROM menu_items WHERE name LIKE '%Test%' OR name LIKE '%Demo%';

-- Clean up any test categories
-- DELETE FROM categories WHERE name LIKE '%Test%' OR name LIKE '%Demo%';

-- Reset sequences and clean orphaned data
-- (Data integrity)

RAISE NOTICE 'Cleanup completed. Demo branding removed.';
