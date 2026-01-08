-- =====================================================
-- PHASE 1: Multi-Tenant Architecture - UPGRADE SCRIPT
-- Run this if organizations table already exists
-- =====================================================

-- Add missing columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#FF6B35',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1A1A2E',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"currency": "INR", "timezone": "Asia/Kolkata"}',
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Create locations table if not exists
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
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
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- Create staff table if not exists
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
    pin_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, employee_code)
);

-- Add organization_id to existing tables (if not exists)
DO $$ 
BEGIN
    -- Categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'organization_id') THEN
        ALTER TABLE categories ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    
    -- Menu Items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'organization_id') THEN
        ALTER TABLE menu_items ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    
    -- Tables (restaurant_tables)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_tables' AND column_name = 'organization_id') THEN
            ALTER TABLE restaurant_tables ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_tables' AND column_name = 'location_id') THEN
            ALTER TABLE restaurant_tables ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'organization_id') THEN
        ALTER TABLE orders ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'location_id') THEN
        ALTER TABLE orders ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    END IF;
    
    -- Customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'organization_id') THEN
        ALTER TABLE customers ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    
    -- Reservations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'organization_id') THEN
        ALTER TABLE reservations ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'location_id') THEN
        ALTER TABLE reservations ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Staff can view their organization" ON organizations;
DROP POLICY IF EXISTS "Staff can view org locations" ON locations;
DROP POLICY IF EXISTS "Staff can view org staff" ON staff;

CREATE POLICY "Staff can view their organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.organization_id = organizations.id 
            AND staff.user_id = auth.uid()
            AND staff.is_active = true
        )
    );

CREATE POLICY "Staff can view org locations" ON locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.organization_id = locations.organization_id 
            AND staff.user_id = auth.uid()
            AND staff.is_active = true
        )
    );

CREATE POLICY "Staff can view org staff" ON staff
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM staff AS s
            WHERE s.user_id = auth.uid() AND s.is_active = true
        )
    );

-- Helper Functions
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

-- Drop existing triggers before recreating
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;

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

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Get first organization ID for seeding
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Get existing org or create demo
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (id, name, slug)
        VALUES ('a0000000-0000-0000-0000-000000000001', 'Demo Restaurant', 'demo-restaurant')
        RETURNING id INTO v_org_id;
    END IF;
    
    -- Create default location if none exists
    IF NOT EXISTS (SELECT 1 FROM locations WHERE organization_id = v_org_id) THEN
        INSERT INTO locations (organization_id, name, code, city, is_primary)
        VALUES (v_org_id, 'Main Branch', 'MAIN-01', 'Mumbai', true);
    END IF;
    
    -- Update existing data
    UPDATE categories SET organization_id = v_org_id WHERE organization_id IS NULL;
    UPDATE menu_items SET organization_id = v_org_id WHERE organization_id IS NULL;
    UPDATE orders SET organization_id = v_org_id WHERE organization_id IS NULL;
    UPDATE customers SET organization_id = v_org_id WHERE organization_id IS NULL;
    UPDATE reservations SET organization_id = v_org_id WHERE organization_id IS NULL;
    
    -- Update restaurant_tables if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables') THEN
        EXECUTE 'UPDATE restaurant_tables SET organization_id = $1 WHERE organization_id IS NULL' USING v_org_id;
    END IF;
    
    RAISE NOTICE 'Migration completed! Organization ID: %', v_org_id;
END $$;
