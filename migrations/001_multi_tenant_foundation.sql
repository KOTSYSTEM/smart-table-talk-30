-- =====================================================
-- PHASE 1: Multi-Tenant Architecture
-- Enterprise SaaS Foundation Migration
-- =====================================================

-- 1. Create Organizations Table (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#FF6B35',
    secondary_color TEXT DEFAULT '#1A1A2E',
    subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
    trial_ends_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "date_format": "DD/MM/YYYY",
        "time_format": "12h",
        "tax_inclusive": true,
        "default_tax_rate": 5,
        "order_prefix": "ORD",
        "invoice_prefix": "INV"
    }',
    billing_email TEXT,
    billing_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Locations Table (Multi-location support)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT, -- Short code like "MUM-01", "DEL-02"
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    opening_time TIME DEFAULT '09:00',
    closing_time TIME DEFAULT '23:00',
    settings JSONB DEFAULT '{}', -- Location-specific overrides
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 3. Create Profiles Table (User profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Staff Table (Staff members with roles)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    employee_code TEXT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'waiter', 'kitchen', 'cashier', 'delivery')),
    permissions JSONB DEFAULT '[]',
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    hired_date DATE DEFAULT CURRENT_DATE,
    pin_code TEXT, -- For quick POS login
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, employee_code)
);

-- 5. Add organization_id to existing tables

-- Categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Menu Items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tables
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- 6. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_org ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_org ON menu_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_tables_org ON tables(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_org ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org ON reservations(organization_id);

-- 7. Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies (Drop first if exists)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view their organization" ON organizations;
DROP POLICY IF EXISTS "Staff can view org locations" ON locations;
DROP POLICY IF EXISTS "Staff can view org staff" ON staff;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can see orgs they belong to
CREATE POLICY "Staff can view their organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.organization_id = organizations.id 
            AND staff.user_id = auth.uid()
            AND staff.is_active = true
        )
    );

-- Locations: Staff can see locations in their org
CREATE POLICY "Staff can view org locations" ON locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.organization_id = locations.organization_id 
            AND staff.user_id = auth.uid()
            AND staff.is_active = true
        )
    );

-- Staff: Staff can see other staff in their org
CREATE POLICY "Staff can view org staff" ON staff
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM staff AS s
            WHERE s.user_id = auth.uid() AND s.is_active = true
        )
    );

-- 9. Create Helper Functions

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT organization_id 
    FROM staff 
    WHERE user_id = auth.uid() 
    AND is_active = true 
    LIMIT 1;
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role 
    FROM staff 
    WHERE user_id = auth.uid() 
    AND is_active = true 
    LIMIT 1;
$$;

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role TEXT;
    user_permissions JSONB;
BEGIN
    SELECT role, permissions INTO user_role, user_permissions
    FROM staff
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
    
    -- Owners have all permissions
    IF user_role = 'owner' THEN
        RETURN true;
    END IF;
    
    -- Check explicit permissions
    RETURN user_permissions ? required_permission;
END;
$$;

-- 10. Create Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Create Profile on User Signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. Seed Default Organization for Development
INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Demo Restaurant',
    'demo-restaurant',
    'professional',
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- Seed Default Location
INSERT INTO locations (id, organization_id, name, code, city, is_primary)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Main Branch',
    'MAIN-01',
    'Mumbai',
    true
) ON CONFLICT DO NOTHING;

-- 13. Update existing data to belong to demo org (for development)
UPDATE categories SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE menu_items SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE tables SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE orders SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE customers SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE reservations SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Phase 1 Multi-Tenant Architecture migration completed successfully!';
END $$;
