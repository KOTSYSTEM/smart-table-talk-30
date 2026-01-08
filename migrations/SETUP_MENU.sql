-- =====================================================
-- COMPREHENSIVE MENU SETUP (Fixed Structure)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. FIX STRUCTURE FIRST: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add sort_order if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'sort_order') THEN
        ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to categories';
    END IF;

    -- Add icon if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE categories ADD COLUMN icon TEXT;
        RAISE NOTICE 'Added icon column to categories';
    END IF;
    
    -- Add is_veg to menu_items if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_veg') THEN
        ALTER TABLE menu_items ADD COLUMN is_veg BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_veg column to menu_items';
    END IF;
END $$;

-- 2. INSERT DATA
DO $$
DECLARE
    v_org_id UUID;
    v_cat_starters UUID;
    v_cat_mains UUID;
    v_cat_biryani UUID;
    v_cat_chinese UUID;
    v_cat_tandoor UUID;
    v_cat_breads UUID;
    v_cat_sides UUID;
    v_cat_desserts UUID;
    v_cat_beer UUID;
    v_cat_whisky UUID;
    v_cat_vodka UUID;
    v_cat_rum UUID;
    v_cat_wine UUID;
    v_cat_cocktails UUID;
    v_cat_mocktails UUID;
    v_cat_softdrinks UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    -- Clear existing menu data
    DELETE FROM menu_items WHERE organization_id = v_org_id;
    DELETE FROM categories WHERE organization_id = v_org_id;
    
    -- ==========================================
    -- FOOD CATEGORIES
    -- ==========================================
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Starters', '🍗', 1, true) RETURNING id INTO v_cat_starters;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Main Course', '🍛', 2, true) RETURNING id INTO v_cat_mains;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Biryani & Rice', '🍚', 3, true) RETURNING id INTO v_cat_biryani;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Chinese', '🥡', 4, true) RETURNING id INTO v_cat_chinese;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Tandoor', '🔥', 5, true) RETURNING id INTO v_cat_tandoor;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Breads', '🫓', 6, true) RETURNING id INTO v_cat_breads;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Sides', '🥗', 7, true) RETURNING id INTO v_cat_sides;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Desserts', '🍨', 8, true) RETURNING id INTO v_cat_desserts;
    
    -- ==========================================
    -- BEVERAGE CATEGORIES
    -- ==========================================
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Beer', '🍺', 10, true) RETURNING id INTO v_cat_beer;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Whisky', '🥃', 11, true) RETURNING id INTO v_cat_whisky;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Vodka', '🍸', 12, true) RETURNING id INTO v_cat_vodka;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Rum', '🥤', 13, true) RETURNING id INTO v_cat_rum;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Wine', '🍷', 14, true) RETURNING id INTO v_cat_wine;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Cocktails', '🍹', 15, true) RETURNING id INTO v_cat_cocktails;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Mocktails', '🧃', 16, true) RETURNING id INTO v_cat_mocktails;
    
    INSERT INTO categories (id, organization_id, name, icon, sort_order, is_active) VALUES 
    (gen_random_uuid(), v_org_id, 'Soft Drinks', '🥤', 17, true) RETURNING id INTO v_cat_softdrinks;

    -- ==========================================
    -- ITEMS INSERTION
    -- ==========================================
    
    -- Starters
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_starters, 'Paneer Tikka', 'Marinated cottage cheese grilled to perfection', 280, true, true),
    (v_org_id, v_cat_starters, 'Chicken Tikka', 'Juicy chicken chunks marinated in spices', 320, true, false),
    (v_org_id, v_cat_starters, 'Mutton Seekh Kebab', 'Minced mutton skewers with aromatic spices', 380, true, false),
    (v_org_id, v_cat_starters, 'Tandoori Chicken', 'Half chicken marinated in yogurt and spices', 350, true, false),
    (v_org_id, v_cat_starters, 'Fish Tikka', 'Fresh fish marinated and grilled', 360, true, false),
    (v_org_id, v_cat_starters, 'Veg Manchurian Dry', 'Crispy vegetable balls in spicy sauce', 220, true, true),
    (v_org_id, v_cat_starters, 'Chicken 65', 'Spicy deep-fried chicken', 290, true, false),
    (v_org_id, v_cat_starters, 'Crispy Corn', 'Golden fried corn with spices', 180, true, true),
    (v_org_id, v_cat_starters, 'Hara Bhara Kebab', 'Green vegetable and spinach patties', 200, true, true),
    (v_org_id, v_cat_starters, 'Prawn Koliwada', 'Crispy fried prawns with spices', 420, true, false);
    
    -- Main Course
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_mains, 'Butter Chicken', 'Creamy tomato-based chicken curry', 380, true, false),
    (v_org_id, v_cat_mains, 'Kadai Chicken', 'Chicken in bell pepper gravy', 360, true, false),
    (v_org_id, v_cat_mains, 'Chicken Tikka Masala', 'Grilled chicken in rich masala gravy', 390, true, false),
    (v_org_id, v_cat_mains, 'Mutton Rogan Josh', 'Kashmiri style mutton curry', 450, true, false),
    (v_org_id, v_cat_mains, 'Mutton Keema', 'Minced mutton with peas', 420, true, false),
    (v_org_id, v_cat_mains, 'Fish Curry', 'Traditional fish in coconut gravy', 380, true, false),
    (v_org_id, v_cat_mains, 'Paneer Butter Masala', 'Cottage cheese in creamy gravy', 320, true, true),
    (v_org_id, v_cat_mains, 'Kadai Paneer', 'Paneer with bell peppers', 300, true, true),
    (v_org_id, v_cat_mains, 'Dal Makhani', 'Slow cooked black lentils', 260, true, true),
    (v_org_id, v_cat_mains, 'Mixed Veg Curry', 'Seasonal vegetables in gravy', 240, true, true),
    (v_org_id, v_cat_mains, 'Palak Paneer', 'Paneer in spinach gravy', 290, true, true),
    (v_org_id, v_cat_mains, 'Egg Curry', 'Boiled eggs in onion tomato gravy', 220, true, false);
    
    -- Biryani
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_biryani, 'Chicken Biryani', 'Aromatic basmati rice with chicken', 320, true, false),
    (v_org_id, v_cat_biryani, 'Mutton Biryani', 'Slow-cooked mutton with fragrant rice', 420, true, false),
    (v_org_id, v_cat_biryani, 'Veg Biryani', 'Mixed vegetables with basmati rice', 260, true, true),
    (v_org_id, v_cat_biryani, 'Egg Biryani', 'Eggs layered with spiced rice', 280, true, false),
    (v_org_id, v_cat_biryani, 'Prawn Biryani', 'Fresh prawns with aromatic rice', 480, true, false),
    (v_org_id, v_cat_biryani, 'Jeera Rice', 'Cumin flavored rice', 150, true, true),
    (v_org_id, v_cat_biryani, 'Steamed Rice', 'Plain basmati rice', 120, true, true),
    (v_org_id, v_cat_biryani, 'Veg Pulao', 'Vegetable fried rice Indian style', 180, true, true);

    -- Chinese
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_chinese, 'Veg Fried Rice', 'Wok-tossed rice with vegetables', 200, true, true),
    (v_org_id, v_cat_chinese, 'Chicken Fried Rice', 'Fried rice with chicken', 260, true, false),
    (v_org_id, v_cat_chinese, 'Egg Fried Rice', 'Fried rice with scrambled eggs', 220, true, false),
    (v_org_id, v_cat_chinese, 'Veg Hakka Noodles', 'Stir-fried noodles with vegetables', 200, true, true),
    (v_org_id, v_cat_chinese, 'Chicken Hakka Noodles', 'Noodles with chicken strips', 260, true, false),
    (v_org_id, v_cat_chinese, 'Chilli Chicken', 'Spicy Indo-Chinese chicken', 320, true, false),
    (v_org_id, v_cat_chinese, 'Chilli Paneer', 'Cottage cheese in spicy sauce', 280, true, true),
    (v_org_id, v_cat_chinese, 'Manchurian Gravy', 'Veg balls in Manchurian sauce', 240, true, true),
    (v_org_id, v_cat_chinese, 'Sweet Corn Soup', 'Creamy corn soup', 160, true, true),
    (v_org_id, v_cat_chinese, 'Hot & Sour Soup (Veg)', 'Tangy spicy soup', 160, true, true),
    (v_org_id, v_cat_chinese, 'Hot & Sour Soup (Chicken)', 'Tangy spicy chicken soup', 180, true, false);
    
    -- Tandoor
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_tandoor, 'Tandoori Roti', 'Whole wheat bread from tandoor', 30, true, true),
    (v_org_id, v_cat_tandoor, 'Butter Naan', 'Soft leavened bread with butter', 50, true, true),
    (v_org_id, v_cat_tandoor, 'Garlic Naan', 'Naan topped with garlic', 60, true, true),
    (v_org_id, v_cat_tandoor, 'Cheese Naan', 'Naan stuffed with cheese', 80, true, true),
    (v_org_id, v_cat_tandoor, 'Paneer Kulcha', 'Stuffed paneer bread', 80, true, true),
    (v_org_id, v_cat_tandoor, 'Laccha Paratha', 'Layered flaky bread', 50, true, true),
    (v_org_id, v_cat_tandoor, 'Rumali Roti', 'Paper thin handkerchief bread', 40, true, true);
    
    -- Sides
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_sides, 'Raita', 'Yogurt with cucumber', 60, true, true),
    (v_org_id, v_cat_sides, 'Green Salad', 'Fresh garden salad', 80, true, true),
    (v_org_id, v_cat_sides, 'Onion Rings', 'Crispy fried onion rings', 100, true, true),
    (v_org_id, v_cat_sides, 'Papad', 'Crispy lentil wafers', 30, true, true),
    (v_org_id, v_cat_sides, 'French Fries', 'Golden crispy fries', 120, true, true);
    
    -- Desserts
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_desserts, 'Gulab Jamun', 'Sweet milk dumplings (2 pcs)', 80, true, true),
    (v_org_id, v_cat_desserts, 'Rasmalai', 'Cottage cheese in sweet milk', 100, true, true),
    (v_org_id, v_cat_desserts, 'Ice Cream', 'Choice of vanilla/chocolate/strawberry', 100, true, true),
    (v_org_id, v_cat_desserts, 'Brownie with Ice Cream', 'Warm brownie served with ice cream', 180, true, true),
    (v_org_id, v_cat_desserts, 'Kheer', 'Rice pudding', 90, true, true);
    
    -- Beer
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_beer, 'Kingfisher Premium (650ml)', 'Strong lager beer', 220, true, true),
    (v_org_id, v_cat_beer, 'Kingfisher Ultra (650ml)', 'Premium mild beer', 280, true, true),
    (v_org_id, v_cat_beer, 'Budweiser (650ml)', 'American lager', 300, true, true),
    (v_org_id, v_cat_beer, 'Corona (330ml)', 'Mexican premium beer', 350, true, true),
    (v_org_id, v_cat_beer, 'Heineken (330ml)', 'Dutch premium lager', 320, true, true),
    (v_org_id, v_cat_beer, 'Bira White (330ml)', 'Wheat beer', 200, true, true),
    (v_org_id, v_cat_beer, 'Bira Blonde (330ml)', 'Craft lager', 200, true, true),
    (v_org_id, v_cat_beer, 'Tuborg Strong (650ml)', 'Strong beer', 200, true, true);
    
    -- Whisky
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_whisky, 'Royal Stag (60ml)', 'Blended Indian whisky', 180, true, true),
    (v_org_id, v_cat_whisky, 'Blenders Pride (60ml)', 'Premium Indian whisky', 220, true, true),
    (v_org_id, v_cat_whisky, 'Black Dog (60ml)', 'Scotch whisky', 320, true, true),
    (v_org_id, v_cat_whisky, 'Black & White (60ml)', 'Blended Scotch', 280, true, true),
    (v_org_id, v_cat_whisky, 'Teachers Highland (60ml)', 'Scottish blend', 350, true, true),
    (v_org_id, v_cat_whisky, 'Johnnie Walker Red (60ml)', 'Classic Scotch blend', 380, true, true),
    (v_org_id, v_cat_whisky, 'Johnnie Walker Black (60ml)', 'Aged 12 years', 550, true, true),
    (v_org_id, v_cat_whisky, 'Jack Daniels (60ml)', 'Tennessee whiskey', 480, true, true),
    (v_org_id, v_cat_whisky, 'Chivas Regal 12 (60ml)', 'Premium Scotch', 650, true, true);
    
    -- Vodka
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_vodka, 'Magic Moments (60ml)', 'Indian vodka', 150, true, true),
    (v_org_id, v_cat_vodka, 'Smirnoff (60ml)', 'Classic vodka', 250, true, true),
    (v_org_id, v_cat_vodka, 'Absolut (60ml)', 'Swedish premium vodka', 350, true, true),
    (v_org_id, v_cat_vodka, 'Grey Goose (60ml)', 'French super-premium', 550, true, true),
    (v_org_id, v_cat_vodka, 'Belvedere (60ml)', 'Polish luxury vodka', 600, true, true);
    
    -- Rum
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_rum, 'Old Monk (60ml)', 'Legendary Indian dark rum', 120, true, true),
    (v_org_id, v_cat_rum, 'Bacardi White (60ml)', 'White rum', 220, true, true),
    (v_org_id, v_cat_rum, 'Bacardi Limon (60ml)', 'Citrus flavored rum', 250, true, true),
    (v_org_id, v_cat_rum, 'Captain Morgan (60ml)', 'Spiced rum', 280, true, true),
    (v_org_id, v_cat_rum, 'Havana Club (60ml)', 'Cuban rum', 350, true, true);
    
    -- Wine
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_wine, 'Sula Sauvignon Blanc (Glass)', 'White wine from Nashik', 280, true, true),
    (v_org_id, v_cat_wine, 'Sula Shiraz (Glass)', 'Red wine from Nashik', 280, true, true),
    (v_org_id, v_cat_wine, 'Sula Riesling (Glass)', 'Sweet white wine', 300, true, true),
    (v_org_id, v_cat_wine, 'Jacob''s Creek (Glass)', 'Australian wine', 350, true, true),
    (v_org_id, v_cat_wine, 'Sangria (Glass)', 'Spanish fruit wine', 250, true, true);
    
    -- Cocktails
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_cocktails, 'Long Island Iced Tea', 'Classic 5 spirit cocktail', 450, true, true),
    (v_org_id, v_cat_cocktails, 'Mojito', 'Rum, mint, lime, soda', 350, true, true),
    (v_org_id, v_cat_cocktails, 'Cosmopolitan', 'Vodka, triple sec, cranberry', 380, true, true),
    (v_org_id, v_cat_cocktails, 'Whisky Sour', 'Whisky, lemon, sugar', 350, true, true),
    (v_org_id, v_cat_cocktails, 'Margarita', 'Tequila, lime, triple sec', 380, true, true),
    (v_org_id, v_cat_cocktails, 'Pina Colada', 'Rum, coconut, pineapple', 380, true, true),
    (v_org_id, v_cat_cocktails, 'Bloody Mary', 'Vodka, tomato juice, spices', 350, true, true),
    (v_org_id, v_cat_cocktails, 'Old Fashioned', 'Bourbon, bitters, sugar', 420, true, true),
    (v_org_id, v_cat_cocktails, 'Daiquiri', 'Rum, lime, sugar', 320, true, true);
    
    -- Mocktails
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_mocktails, 'Virgin Mojito', 'Lime, mint, sprite', 180, true, true),
    (v_org_id, v_cat_mocktails, 'Blue Lagoon', 'Blue curacao syrup, lemonade', 180, true, true),
    (v_org_id, v_cat_mocktails, 'Strawberry Fizz', 'Strawberry, lemon, soda', 180, true, true),
    (v_org_id, v_cat_mocktails, 'Mango Tango', 'Fresh mango, orange juice', 200, true, true),
    (v_org_id, v_cat_mocktails, 'Watermelon Cooler', 'Fresh watermelon juice', 150, true, true),
    (v_org_id, v_cat_mocktails, 'Fruit Punch', 'Mixed fruit juices', 180, true, true);
    
    -- Soft Drinks
    INSERT INTO menu_items (organization_id, category_id, name, description, price, is_available, is_veg) VALUES
    (v_org_id, v_cat_softdrinks, 'Coca-Cola (300ml)', 'Classic cola', 50, true, true),
    (v_org_id, v_cat_softdrinks, 'Sprite (300ml)', 'Lemon-lime soda', 50, true, true),
    (v_org_id, v_cat_softdrinks, 'Fanta (300ml)', 'Orange soda', 50, true, true),
    (v_org_id, v_cat_softdrinks, 'Thumbs Up (300ml)', 'Indian cola', 50, true, true),
    (v_org_id, v_cat_softdrinks, 'Limca (300ml)', 'Cloudy lemon drink', 50, true, true),
    (v_org_id, v_cat_softdrinks, 'Red Bull (250ml)', 'Energy drink', 150, true, true),
    (v_org_id, v_cat_softdrinks, 'Mineral Water (500ml)', 'Packaged drinking water', 30, true, true),
    (v_org_id, v_cat_softdrinks, 'Mineral Water (1L)', 'Packaged drinking water', 50, true, true),
    (v_org_id, v_cat_softdrinks, 'Soda (300ml)', 'Plain soda water', 40, true, true),
    (v_org_id, v_cat_softdrinks, 'Fresh Lime Water', 'Nimbu pani', 60, true, true),
    (v_org_id, v_cat_softdrinks, 'Fresh Lime Soda', 'Sweet/salt lime soda', 80, true, true);
    
    RAISE NOTICE 'Menu setup complete!';
END $$;

-- Validation
SELECT name, sort_order FROM categories ORDER BY sort_order;
SELECT COUNT(*) as total_items FROM menu_items;
