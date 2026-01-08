-- =====================================================
-- PHASE 2: Advanced User Management & Security
-- RBAC, Audit Logging, Staff Scheduling
-- =====================================================

-- 1. Permissions Table (Granular permissions)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'pos.create_order', 'menu.edit'
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL, -- dashboard, pos, kitchen, menu, orders, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Role Templates (Pre-defined role configurations)
CREATE TABLE IF NOT EXISTS role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN DEFAULT false, -- System roles can't be deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff Schedules
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Time Entries (Clock in/out)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_break_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'clocked_in' CHECK (status IN ('clocked_in', 'on_break', 'clocked_out')),
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audit Logs (Track all changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    staff_id UUID REFERENCES staff(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
    entity_type TEXT NOT NULL, -- 'order', 'menu_item', 'customer', etc.
    entity_id UUID,
    entity_name TEXT, -- Human readable name for quick reference
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Summary of what changed
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Login History
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id),
    login_at TIMESTAMPTZ DEFAULT NOW(),
    logout_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    location_id UUID REFERENCES locations(id),
    success BOOLEAN DEFAULT true,
    failure_reason TEXT
);

-- 7. Performance Metrics (Staff performance tracking)
CREATE TABLE IF NOT EXISTS staff_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    orders_handled INTEGER DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    average_order_time INTEGER, -- in minutes
    customer_ratings_count INTEGER DEFAULT 0,
    customer_ratings_sum DECIMAL(5,2) DEFAULT 0,
    tips_received DECIMAL(10,2) DEFAULT 0,
    attendance_percentage DECIMAL(5,2),
    late_arrivals INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, period_start, period_end)
);

-- 8. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_staff ON time_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff ON staff_performance(staff_id);

-- 9. Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies

-- Permissions: Everyone can read
CREATE POLICY "Anyone can view permissions" ON permissions FOR SELECT USING (true);

-- Role Templates: Org members can view their org's templates
DROP POLICY IF EXISTS "Staff can view org role templates" ON role_templates;
CREATE POLICY "Staff can view org role templates" ON role_templates
    FOR SELECT USING (
        organization_id IS NULL OR -- System templates
        organization_id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Staff Schedules: Staff can view their org's schedules
DROP POLICY IF EXISTS "Staff can view org schedules" ON staff_schedules;
CREATE POLICY "Staff can view org schedules" ON staff_schedules
    FOR SELECT USING (
        staff_id IN (
            SELECT id FROM staff WHERE organization_id IN (
                SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- Time Entries: Staff can view their own or org's time entries
DROP POLICY IF EXISTS "Staff can view time entries" ON time_entries;
CREATE POLICY "Staff can view time entries" ON time_entries
    FOR SELECT USING (
        staff_id IN (
            SELECT id FROM staff WHERE 
                user_id = auth.uid() OR
                organization_id IN (
                    SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'manager')
                )
        )
    );

-- Audit Logs: Only managers/owners can view
DROP POLICY IF EXISTS "Managers can view audit logs" ON audit_logs;
CREATE POLICY "Managers can view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM staff 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'manager')
        )
    );

-- Login History: Users see their own, managers see org's
DROP POLICY IF EXISTS "Users can view login history" ON login_history;
CREATE POLICY "Users can view login history" ON login_history
    FOR SELECT USING (
        user_id = auth.uid() OR
        staff_id IN (
            SELECT id FROM staff WHERE organization_id IN (
                SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'manager')
            )
        )
    );

-- Staff Performance: Managers can view
DROP POLICY IF EXISTS "Managers can view performance" ON staff_performance;
CREATE POLICY "Managers can view performance" ON staff_performance
    FOR SELECT USING (
        staff_id IN (
            SELECT id FROM staff WHERE 
                user_id = auth.uid() OR
                organization_id IN (
                    SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'manager')
                )
        )
    );

-- 11. Seed Default Permissions
INSERT INTO permissions (code, name, description, module) VALUES
    -- Dashboard
    ('dashboard.view', 'View Dashboard', 'Access to main dashboard', 'dashboard'),
    ('dashboard.analytics', 'View Analytics', 'Access to analytics and insights', 'dashboard'),
    
    -- POS
    ('pos.view', 'Access POS', 'Access point of sale', 'pos'),
    ('pos.create_order', 'Create Orders', 'Create new orders', 'pos'),
    ('pos.void_order', 'Void Orders', 'Cancel/void orders', 'pos'),
    ('pos.apply_discount', 'Apply Discounts', 'Apply discounts to orders', 'pos'),
    ('pos.refund', 'Process Refunds', 'Process order refunds', 'pos'),
    
    -- Kitchen
    ('kitchen.view', 'View Kitchen Display', 'Access kitchen display', 'kitchen'),
    ('kitchen.update_status', 'Update Order Status', 'Update order preparation status', 'kitchen'),
    
    -- Menu
    ('menu.view', 'View Menu', 'View menu items', 'menu'),
    ('menu.create', 'Create Menu Items', 'Add new menu items', 'menu'),
    ('menu.edit', 'Edit Menu Items', 'Modify menu items', 'menu'),
    ('menu.delete', 'Delete Menu Items', 'Remove menu items', 'menu'),
    ('menu.pricing', 'Manage Pricing', 'Change prices and discounts', 'menu'),
    
    -- Tables
    ('tables.view', 'View Tables', 'View table layout', 'tables'),
    ('tables.manage', 'Manage Tables', 'Assign and manage tables', 'tables'),
    
    -- Orders
    ('orders.view', 'View Orders', 'View all orders', 'orders'),
    ('orders.edit', 'Edit Orders', 'Modify orders', 'orders'),
    ('orders.delete', 'Delete Orders', 'Remove orders', 'orders'),
    
    -- Customers
    ('customers.view', 'View Customers', 'View customer list', 'customers'),
    ('customers.create', 'Create Customers', 'Add new customers', 'customers'),
    ('customers.edit', 'Edit Customers', 'Modify customer info', 'customers'),
    
    -- Reservations
    ('reservations.view', 'View Reservations', 'View reservations', 'reservations'),
    ('reservations.create', 'Create Reservations', 'Make reservations', 'reservations'),
    ('reservations.edit', 'Edit Reservations', 'Modify reservations', 'reservations'),
    
    -- Reports
    ('reports.view', 'View Reports', 'Access reports', 'reports'),
    ('reports.export', 'Export Reports', 'Export report data', 'reports'),
    
    -- Settings
    ('settings.view', 'View Settings', 'View system settings', 'settings'),
    ('settings.edit', 'Edit Settings', 'Modify system settings', 'settings'),
    
    -- Staff Management
    ('staff.view', 'View Staff', 'View staff list', 'staff'),
    ('staff.create', 'Create Staff', 'Add new staff members', 'staff'),
    ('staff.edit', 'Edit Staff', 'Modify staff info', 'staff'),
    ('staff.delete', 'Delete Staff', 'Remove staff members', 'staff'),
    ('staff.schedule', 'Manage Schedules', 'Create and edit schedules', 'staff'),
    
    -- Inventory
    ('inventory.view', 'View Inventory', 'View stock levels', 'inventory'),
    ('inventory.manage', 'Manage Inventory', 'Update stock levels', 'inventory'),
    ('inventory.purchase', 'Create Purchase Orders', 'Create purchase orders', 'inventory')
ON CONFLICT (code) DO NOTHING;

-- 12. Seed Default Role Templates (System-wide)
INSERT INTO role_templates (organization_id, name, description, permissions, is_system) VALUES
    (NULL, 'Owner', 'Full access to all features', ARRAY[
        'dashboard.view', 'dashboard.analytics',
        'pos.view', 'pos.create_order', 'pos.void_order', 'pos.apply_discount', 'pos.refund',
        'kitchen.view', 'kitchen.update_status',
        'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'menu.pricing',
        'tables.view', 'tables.manage',
        'orders.view', 'orders.edit', 'orders.delete',
        'customers.view', 'customers.create', 'customers.edit',
        'reservations.view', 'reservations.create', 'reservations.edit',
        'reports.view', 'reports.export',
        'settings.view', 'settings.edit',
        'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.schedule',
        'inventory.view', 'inventory.manage', 'inventory.purchase'
    ], true),
    
    (NULL, 'Manager', 'Restaurant management access', ARRAY[
        'dashboard.view', 'dashboard.analytics',
        'pos.view', 'pos.create_order', 'pos.void_order', 'pos.apply_discount',
        'kitchen.view', 'kitchen.update_status',
        'menu.view', 'menu.create', 'menu.edit',
        'tables.view', 'tables.manage',
        'orders.view', 'orders.edit',
        'customers.view', 'customers.create', 'customers.edit',
        'reservations.view', 'reservations.create', 'reservations.edit',
        'reports.view', 'reports.export',
        'settings.view',
        'staff.view', 'staff.create', 'staff.edit', 'staff.schedule',
        'inventory.view', 'inventory.manage'
    ], true),
    
    (NULL, 'Waiter', 'Front-of-house staff', ARRAY[
        'dashboard.view',
        'pos.view', 'pos.create_order',
        'tables.view', 'tables.manage',
        'orders.view',
        'reservations.view', 'reservations.create'
    ], true),
    
    (NULL, 'Kitchen Staff', 'Kitchen operations', ARRAY[
        'kitchen.view', 'kitchen.update_status',
        'menu.view',
        'orders.view',
        'inventory.view'
    ], true),
    
    (NULL, 'Cashier', 'Payment processing', ARRAY[
        'dashboard.view',
        'pos.view', 'pos.create_order',
        'orders.view',
        'customers.view', 'customers.create',
        'reports.view'
    ], true),
    
    (NULL, 'Delivery', 'Delivery operations', ARRAY[
        'orders.view'
    ], true)
ON CONFLICT DO NOTHING;

-- 13. Audit Log Function
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
    v_org_id UUID;
    v_staff_id UUID;
BEGIN
    -- Get current user's org and staff
    SELECT organization_id, id INTO v_org_id, v_staff_id
    FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
    
    INSERT INTO audit_logs (
        organization_id, user_id, staff_id, action, entity_type,
        entity_id, entity_name, old_values, new_values, metadata
    ) VALUES (
        v_org_id, auth.uid(), v_staff_id, p_action, p_entity_type,
        p_entity_id, p_entity_name, p_old_values, p_new_values, p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- 14. Clock In/Out Functions
CREATE OR REPLACE FUNCTION clock_in(p_location_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_entry_id UUID;
BEGIN
    -- Get staff ID
    SELECT id INTO v_staff_id FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
    
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'Staff record not found';
    END IF;
    
    -- Check if already clocked in
    IF EXISTS (SELECT 1 FROM time_entries WHERE staff_id = v_staff_id AND clock_out IS NULL) THEN
        RAISE EXCEPTION 'Already clocked in';
    END IF;
    
    -- Create entry
    INSERT INTO time_entries (staff_id, location_id, clock_in)
    VALUES (v_staff_id, p_location_id, NOW())
    RETURNING id INTO v_entry_id;
    
    -- Log audit
    PERFORM log_audit_event('clock_in', 'time_entry', v_entry_id);
    
    RETURN v_entry_id;
END;
$$;

CREATE OR REPLACE FUNCTION clock_out()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_entry_id UUID;
BEGIN
    -- Get staff ID
    SELECT id INTO v_staff_id FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
    
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'Staff record not found';
    END IF;
    
    -- Update entry
    UPDATE time_entries 
    SET clock_out = NOW(), status = 'clocked_out'
    WHERE staff_id = v_staff_id AND clock_out IS NULL
    RETURNING id INTO v_entry_id;
    
    IF v_entry_id IS NULL THEN
        RAISE EXCEPTION 'No active clock-in found';
    END IF;
    
    -- Log audit
    PERFORM log_audit_event('clock_out', 'time_entry', v_entry_id);
    
    RETURN v_entry_id;
END;
$$;

-- 15. Update triggers
DROP TRIGGER IF EXISTS update_role_templates_updated_at ON role_templates;
DROP TRIGGER IF EXISTS update_staff_schedules_updated_at ON staff_schedules;

CREATE TRIGGER update_role_templates_updated_at
    BEFORE UPDATE ON role_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at
    BEFORE UPDATE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success
DO $$
BEGIN
    RAISE NOTICE 'Phase 2: Advanced User Management & Security migration completed!';
END $$;
