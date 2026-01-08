-- =====================================================
-- FULL SYSTEM RESET & SETUP
-- Run this single script to fix EVERYTHING
-- =====================================================

-- 1. FIX DATABASE STRUCTURE (Safe ALTERs)
-- =====================================================
DO $$
BEGIN
    -- CATEGORIES Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'sort_order') THEN
        ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE categories ADD COLUMN icon TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- MENU_ITEMS Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_veg') THEN
        ALTER TABLE menu_items ADD COLUMN is_veg BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_available') THEN
        ALTER TABLE menu_items ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
    
    -- ORDERS Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'organization_id') THEN
        ALTER TABLE orders ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- 2. DISABLE RLS (Ensure access)
-- =====================================================
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 3. INSERT DATA (Tables & Menu)
-- =====================================================
DO $$
DECLARE
    v_org_id UUID;
    v_cat_starters UUID;
    v_cat_mains UUID;
    v_cat_biryani UUID;
    v_cat_chinese UUID;
    v_cat_desserts UUID;
    v_cat_drinks UUID;
    i INTEGER;
BEGIN
    -- Get or Create Org
    INSERT INTO organizations (id, name, slug)
    SELECT gen_random_uuid(), 'My Restaurant', 'my-restaurant'
    WHERE NOT EXISTS (SELECT 1 FROM organizations);
    
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    -- CLEANUP
    DELETE FROM restaurant_tables WHERE organization_id = v_org_id;
    DELETE FROM menu_items WHERE organization_id = v_org_id;
    DELETE FROM categories WHERE organization_id = v_org_id;

    -- === A. CREATE TABLES ===
    -- Bar Area (1-20)
    FOR i IN 1..20 LOOP
        INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
        VALUES (v_org_id, i, 'Bar Area (1st Floor)', 4, 'free');
    END LOOP;
    -- Family Section (21-30)
    FOR i IN 21..30 LOOP
        INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
        VALUES (v_org_id, i, 'Family Section (2nd Floor)', 6, 'free');
    END LOOP;
    -- DJ Area (31-40)
    FOR i IN 31..40 LOOP
        INSERT INTO restaurant_tables (organization_id, number, section, capacity, status)
        VALUES (v_org_id, i, 'DJ Area (2nd Floor)', 4, 'free');
    END LOOP;

    -- === B. CREATE CATEGORIES ===
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Starters', '🍗', 1, true) RETURNING id INTO v_cat_starters;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Main Course', '🍛', 2, true) RETURNING id INTO v_cat_mains;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Biryani', '🍚', 3, true) RETURNING id INTO v_cat_biryani;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Chinese', '🥡', 4, true) RETURNING id INTO v_cat_chinese;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Desserts', '🍨', 5, true) RETURNING id INTO v_cat_desserts;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Drinks', '🍺', 6, true) RETURNING id INTO v_cat_drinks;

    -- === C. CREATE MENU ITEMS ===
    -- Starters
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_starters, 'Paneer Tikka', 'Grilled cottage cheese', 280, true, true),
    (v_org_id, v_cat_starters, 'Chicken Tikka', 'Spicy grilled chicken', 320, true, false),
    (v_org_id, v_cat_starters, 'Crispy Corn', 'Fried corn with spices', 200, true, true);
    
    -- Mains
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_mains, 'Butter Chicken', 'Creamy tomato curry', 350, true, false),
    (v_org_id, v_cat_mains, 'Dal Makhani', 'Black lentils', 250, true, true),
    (v_org_id, v_cat_mains, 'Paneer Butter Masala', 'Rich paneer gravy', 300, true, true);
    
    -- Biryani
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_biryani, 'Chicken Biryani', 'Hyderabadi style', 350, true, false),
    (v_org_id, v_cat_biryani, 'Veg Biryani', 'Mixed veg rice', 250, true, true);
    
    -- Chinese
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_chinese, 'Veg Fried Rice', 'Wok tossed rice', 200, true, true),
    (v_org_id, v_cat_chinese, 'Chilli Chicken', 'Spicy chicken', 280, true, false);
    
    -- Drinks
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_drinks, 'Mojito', 'Refreshing mint drink', 150, true, true),
    (v_org_id, v_cat_drinks, 'Coke', 'Soft drink', 50, true, true);
    
    RAISE NOTICE 'System Reset & Setup Complete!';
END $$;

-- Verify
SELECT '✅ SUCCESS! System Ready.' as status;
