-- =====================================================
-- PHASE 3: Enhanced Data Model & Features
-- Inventory, Loyalty, Menu Variants, Recipes
-- =====================================================

-- ============ INVENTORY MANAGEMENT ============

-- 1. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    gst_number TEXT,
    payment_terms TEXT DEFAULT 'Net 30',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 2. Inventory Items (Raw materials, ingredients)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    unit TEXT NOT NULL, -- kg, g, liters, ml, pieces, etc.
    current_stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    min_stock_level DECIMAL(12,3) DEFAULT 0,
    max_stock_level DECIMAL(12,3),
    reorder_level DECIMAL(12,3),
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    storage_location TEXT,
    expiry_tracking BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_restocked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, sku)
);

-- 3. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled')),
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    ordered_at TIMESTAMPTZ,
    expected_delivery DATE,
    received_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, order_number)
);

-- 4. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_ordered DECIMAL(12,3) NOT NULL,
    quantity_received DECIMAL(12,3) DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT
);

-- 5. Stock Movements (Track all stock changes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'consumption', 'adjustment', 'waste', 'transfer', 'return')),
    quantity DECIMAL(12,3) NOT NULL, -- Positive for in, negative for out
    unit_cost DECIMAL(10,2),
    reference_type TEXT, -- 'purchase_order', 'order', 'manual'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CUSTOMER LOYALTY & CRM ============

-- 6. Add loyalty columns to customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_order_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allergies TEXT[],
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[],
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS anniversary DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. Loyalty Rules
CREATE TABLE IF NOT EXISTS loyalty_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    points_per_currency DECIMAL(5,2) DEFAULT 1, -- Points earned per ₹100 spent
    redemption_rate DECIMAL(5,2) DEFAULT 0.25, -- ₹0.25 per point
    min_redemption_points INTEGER DEFAULT 100,
    tier_thresholds JSONB DEFAULT '{"silver": 1000, "gold": 5000, "platinum": 15000}',
    tier_benefits JSONB DEFAULT '{}',
    bonus_rules JSONB DEFAULT '[]', -- Birthday bonus, signup bonus, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'bonus', 'expire', 'adjust')),
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Customer Feedback
CREATE TABLE IF NOT EXISTS customer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    ambiance_rating INTEGER CHECK (ambiance_rating >= 1 AND ambiance_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    comments TEXT,
    would_recommend BOOLEAN,
    staff_id UUID REFERENCES staff(id),
    response TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ADVANCED MENU MANAGEMENT ============

-- 10. Menu Item Variants (Sizes)
CREATE TABLE IF NOT EXISTS menu_item_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Small", "Medium", "Large", "Half", "Full"
    sku TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_item_id, name)
);

-- 11. Modifier Groups (Add-ons categories)
CREATE TABLE IF NOT EXISTS modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Extra Toppings", "Spice Level", "Cooking Style"
    description TEXT,
    selection_type TEXT DEFAULT 'multiple' CHECK (selection_type IN ('single', 'multiple')),
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Modifiers (Individual add-on options)
CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Menu Item Modifier Links
CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false, -- Override group default
    sort_order INTEGER DEFAULT 0,
    UNIQUE(menu_item_id, modifier_group_id)
);

-- 14. Pricing Rules (Dynamic pricing)
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('time_based', 'day_based', 'customer_tier', 'quantity', 'combo', 'happy_hour')),
    conditions JSONB NOT NULL DEFAULT '{}',
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed', 'new_price')),
    adjustment_value DECIMAL(10,2) NOT NULL,
    applies_to JSONB DEFAULT '{"type": "all"}', -- all, category, items
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RECIPE MANAGEMENT ============

-- 15. Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    menu_item_variant_id UUID REFERENCES menu_item_variants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    yield_quantity DECIMAL(10,2) DEFAULT 1,
    yield_unit TEXT DEFAULT 'portion',
    preparation_time INTEGER, -- minutes
    cooking_time INTEGER, -- minutes
    instructions TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Recipe Ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity DECIMAL(12,3) NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    is_optional BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- ============ ENHANCED RESERVATIONS ============

-- 17. Add waitlist columns to reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,
ADD COLUMN IF NOT EXISTS estimated_wait_minutes INTEGER,
ADD COLUMN IF NOT EXISTS actual_seated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_left_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS special_occasion TEXT,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'walk-in' CHECK (source IN ('walk-in', 'phone', 'website', 'app', 'third-party'));

-- 18. Table Sections/Zones
CREATE TABLE IF NOT EXISTS table_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Main Hall", "Rooftop", "Private Dining", "Patio"
    description TEXT,
    capacity INTEGER,
    is_smoking BOOLEAN DEFAULT false,
    is_outdoor BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    min_spend DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Link tables to sections
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES table_sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS min_capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS is_combinable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS position_x INTEGER,
ADD COLUMN IF NOT EXISTS position_y INTEGER;

-- ============ DELIVERY ZONE MANAGEMENT ============

-- 20. Delivery Zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    polygon JSONB, -- GeoJSON coordinates
    pincodes TEXT[], -- Array of pincodes
    minimum_order DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    free_delivery_above DECIMAL(10,2),
    estimated_time_minutes INTEGER DEFAULT 45,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Delivery Partners Integration
CREATE TABLE IF NOT EXISTS delivery_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Swiggy, Zomato, Dunzo, In-house
    partner_type TEXT DEFAULT 'third_party' CHECK (partner_type IN ('in_house', 'third_party', 'hybrid')),
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    webhook_url TEXT,
    commission_percentage DECIMAL(5,2),
    commission_fixed DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_org ON inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_org ON customer_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_item ON menu_item_variants(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_group ON modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_recipes_org ON recipes(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_location ON delivery_zones(location_id);

-- ============ RLS POLICIES ============

-- Enable RLS on all new tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

-- Create policies for org-scoped tables
DO $$
DECLARE
    tbl TEXT;
    tables_list TEXT[] := ARRAY[
        'suppliers', 'inventory_items', 'purchase_orders', 'stock_movements',
        'loyalty_rules', 'loyalty_transactions', 'customer_feedback',
        'modifier_groups', 'pricing_rules', 'recipes', 'delivery_partners'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_list
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Staff can view org %I" ON %I;
            CREATE POLICY "Staff can view org %I" ON %I
                FOR SELECT USING (
                    organization_id IN (
                        SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true
                    )
                );
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Policies for location-scoped tables
DROP POLICY IF EXISTS "Staff can view table sections" ON table_sections;
CREATE POLICY "Staff can view table sections" ON table_sections
    FOR SELECT USING (
        location_id IN (
            SELECT id FROM locations WHERE organization_id IN (
                SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Staff can view delivery zones" ON delivery_zones;
CREATE POLICY "Staff can view delivery zones" ON delivery_zones
    FOR SELECT USING (
        location_id IN (
            SELECT id FROM locations WHERE organization_id IN (
                SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- Policies for linked tables
DROP POLICY IF EXISTS "Staff can view variants" ON menu_item_variants;
CREATE POLICY "Staff can view variants" ON menu_item_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can view modifiers" ON modifiers;
CREATE POLICY "Staff can view modifiers" ON modifiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can view modifier links" ON menu_item_modifier_groups;
CREATE POLICY "Staff can view modifier links" ON menu_item_modifier_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can view recipe ingredients" ON recipe_ingredients;
CREATE POLICY "Staff can view recipe ingredients" ON recipe_ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can view po items" ON purchase_order_items;
CREATE POLICY "Staff can view po items" ON purchase_order_items FOR SELECT USING (true);

-- ============ HELPER FUNCTIONS ============

-- Calculate recipe cost
CREATE OR REPLACE FUNCTION calculate_recipe_cost(p_recipe_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_cost DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(ri.quantity * ii.cost_per_unit), 0) INTO total_cost
    FROM recipe_ingredients ri
    JOIN inventory_items ii ON ii.id = ri.inventory_item_id
    WHERE ri.recipe_id = p_recipe_id;
    
    RETURN total_cost;
END;
$$;

-- Update customer loyalty tier
CREATE OR REPLACE FUNCTION update_customer_loyalty_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    tier_config JSONB;
    new_tier TEXT;
BEGIN
    -- Get tier thresholds from loyalty rules
    SELECT tier_thresholds INTO tier_config
    FROM loyalty_rules
    WHERE organization_id = NEW.organization_id AND is_active = true
    LIMIT 1;
    
    IF tier_config IS NULL THEN
        tier_config := '{"silver": 1000, "gold": 5000, "platinum": 15000}';
    END IF;
    
    -- Determine tier based on points
    IF NEW.loyalty_points >= (tier_config->>'platinum')::INTEGER THEN
        new_tier := 'platinum';
    ELSIF NEW.loyalty_points >= (tier_config->>'gold')::INTEGER THEN
        new_tier := 'gold';
    ELSIF NEW.loyalty_points >= (tier_config->>'silver')::INTEGER THEN
        new_tier := 'silver';
    ELSE
        new_tier := 'bronze';
    END IF;
    
    NEW.loyalty_tier := new_tier;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customer_loyalty_tier_update ON customers;
CREATE TRIGGER customer_loyalty_tier_update
    BEFORE UPDATE OF loyalty_points ON customers
    FOR EACH ROW EXECUTE FUNCTION update_customer_loyalty_tier();

-- Auto-consume inventory on order completion
CREATE OR REPLACE FUNCTION consume_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only trigger when order status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Insert stock movements for each order item's recipe ingredients
        INSERT INTO stock_movements (
            organization_id, inventory_item_id, movement_type, quantity,
            reference_type, reference_id, notes
        )
        SELECT 
            NEW.organization_id,
            ri.inventory_item_id,
            'consumption',
            -(ri.quantity * oi.quantity), -- Negative for consumption
            'order',
            NEW.id,
            'Auto-consumed from order #' || NEW.id
        FROM order_items oi
        JOIN recipes r ON r.menu_item_id = oi.menu_item_id
        JOIN recipe_ingredients ri ON ri.recipe_id = r.id
        WHERE oi.order_id = NEW.id;
        
        -- Update inventory item stock levels
        UPDATE inventory_items ii
        SET current_stock = current_stock + sm.total_qty
        FROM (
            SELECT inventory_item_id, SUM(quantity) as total_qty
            FROM stock_movements
            WHERE reference_type = 'order' AND reference_id = NEW.id
            GROUP BY inventory_item_id
        ) sm
        WHERE ii.id = sm.inventory_item_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update triggers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS update_loyalty_rules_updated_at ON loyalty_rules;
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
DROP TRIGGER IF EXISTS update_delivery_partners_updated_at ON delivery_partners;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_rules_updated_at BEFORE UPDATE ON loyalty_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_partners_updated_at BEFORE UPDATE ON delivery_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success
DO $$
BEGIN
    RAISE NOTICE 'Phase 3: Enhanced Data Model & Features migration completed!';
END $$;
