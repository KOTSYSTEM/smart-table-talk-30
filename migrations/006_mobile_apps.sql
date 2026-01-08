-- =====================================================
-- PHASE 6: Mobile Applications Support
-- Device Management, Sync, Offline Support
-- =====================================================

-- ============ DEVICE MANAGEMENT ============

-- 1. Registered Devices
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('pos', 'kds', 'tablet', 'mobile', 'printer', 'scanner')),
    device_name TEXT NOT NULL,
    device_model TEXT,
    os_type TEXT CHECK (os_type IN ('android', 'ios', 'windows', 'linux', 'web')),
    os_version TEXT,
    app_version TEXT,
    device_token TEXT UNIQUE, -- For push notifications
    last_active TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Device Sessions
CREATE TABLE IF NOT EXISTS device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_token TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    ip_address INET,
    metadata JSONB DEFAULT '{}'
);

-- 3. Printer Configuration
CREATE TABLE IF NOT EXISTS printers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    printer_type TEXT NOT NULL CHECK (printer_type IN ('receipt', 'kitchen', 'label', 'report')),
    connection_type TEXT NOT NULL CHECK (connection_type IN ('usb', 'bluetooth', 'network', 'cloud')),
    ip_address TEXT,
    port INTEGER,
    mac_address TEXT,
    paper_width INTEGER DEFAULT 80, -- mm
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    assigned_categories UUID[], -- For kitchen printers
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ OFFLINE SYNC ============

-- 4. Sync Queue (For offline operations)
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'conflict')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 5. Sync Checkpoints (Track sync state per device)
CREATE TABLE IF NOT EXISTS sync_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ NOT NULL,
    last_sync_id UUID,
    record_count INTEGER DEFAULT 0,
    UNIQUE(device_id, entity_type)
);

-- ============ KITCHEN DISPLAY SYSTEM ============

-- 6. KDS Stations
CREATE TABLE IF NOT EXISTS kds_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    station_type TEXT DEFAULT 'prep' CHECK (station_type IN ('prep', 'grill', 'fry', 'salad', 'expo', 'bar', 'all')),
    assigned_categories UUID[], -- Which menu categories this station handles
    display_order INTEGER DEFAULT 0,
    alert_threshold_minutes INTEGER DEFAULT 15, -- Yellow alert
    urgent_threshold_minutes INTEGER DEFAULT 25, -- Red alert
    auto_bump BOOLEAN DEFAULT false,
    auto_bump_delay_seconds INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. KDS Order Items (Enhanced order tracking)
CREATE TABLE IF NOT EXISTS kds_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL, -- References order_items but may be offline
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES kds_stations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'ready', 'bumped', 'recalled')),
    priority INTEGER DEFAULT 0, -- Higher = more urgent
    special_instructions TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    bumped_at TIMESTAMPTZ,
    bumped_by UUID REFERENCES auth.users(id),
    recalled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ DRIVER/DELIVERY APP ============

-- 8. Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    vehicle_type TEXT CHECK (vehicle_type IN ('bike', 'scooter', 'car', 'van', 'bicycle')),
    vehicle_number TEXT,
    license_number TEXT,
    is_available BOOLEAN DEFAULT false,
    current_location JSONB, -- {lat, lng, updated_at}
    max_concurrent_orders INTEGER DEFAULT 3,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_deliveries INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Driver Assignments
CREATE TABLE IF NOT EXISTS driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'picked_up', 'en_route', 'delivered', 'failed', 'cancelled')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    distance_km DECIMAL(8,2),
    estimated_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    delivery_notes TEXT,
    proof_of_delivery TEXT, -- Photo URL
    customer_signature TEXT, -- Signature data
    rating_by_customer INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id) -- One driver per order
);

-- 10. Driver Location History
CREATE TABLE IF NOT EXISTS driver_location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES driver_assignments(id) ON DELETE SET NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    accuracy DECIMAL(10,2),
    speed DECIMAL(10,2),
    heading DECIMAL(5,2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ POS TERMINALS ============

-- 11. POS Terminals
CREATE TABLE IF NOT EXISTS pos_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    terminal_name TEXT NOT NULL,
    terminal_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    current_shift_id UUID,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, terminal_number)
);

-- 12. Cash Drawer Shifts
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    terminal_id UUID NOT NULL REFERENCES pos_terminals(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_balance DECIMAL(12,2) NOT NULL,
    closing_balance DECIMAL(12,2),
    expected_cash DECIMAL(12,2),
    actual_cash DECIMAL(12,2),
    variance DECIMAL(12,2),
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_refunds DECIMAL(12,2) DEFAULT 0,
    cash_payments DECIMAL(12,2) DEFAULT 0,
    card_payments DECIMAL(12,2) DEFAULT 0,
    upi_payments DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled'))
);

-- 13. Cash Movements
CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'refund', 'pay_in', 'pay_out', 'drop', 'adjustment')),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_type TEXT, -- 'order', 'expense', 'manual'
    reference_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device ON device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_device ON sync_queue(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_kds_stations_location ON kds_stations(location_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_items_station ON kds_order_items(station_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_items_status ON kds_order_items(status);
CREATE INDEX IF NOT EXISTS idx_drivers_org ON drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_order ON driver_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_location_driver ON driver_location_history(driver_id);
CREATE INDEX IF NOT EXISTS idx_pos_terminals_location ON pos_terminals(location_id);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_terminal ON cash_shifts(terminal_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id);

-- ============ RLS ============

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- Policies for org-scoped tables
DO $$
DECLARE
    tbl TEXT;
    tables_list TEXT[] := ARRAY[
        'devices', 'printers', 'sync_queue', 'kds_stations',
        'drivers', 'pos_terminals', 'cash_shifts'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_list
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Staff view org %I" ON %I;
            CREATE POLICY "Staff view org %I" ON %I
                FOR SELECT USING (
                    organization_id IN (
                        SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true
                    )
                );
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Device sessions - user sees their own
DROP POLICY IF EXISTS "Users view own sessions" ON device_sessions;
CREATE POLICY "Users view own sessions" ON device_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Sync checkpoints - device owner
DROP POLICY IF EXISTS "Device owner checkpoints" ON sync_checkpoints;
CREATE POLICY "Device owner checkpoints" ON sync_checkpoints
    FOR ALL USING (
        device_id IN (SELECT id FROM devices WHERE user_id = auth.uid())
    );

-- KDS order items - same as orders
DROP POLICY IF EXISTS "Staff view kds items" ON kds_order_items;
CREATE POLICY "Staff view kds items" ON kds_order_items FOR SELECT USING (true);

-- Driver assignments - staff
DROP POLICY IF EXISTS "Staff view assignments" ON driver_assignments;
CREATE POLICY "Staff view assignments" ON driver_assignments FOR SELECT USING (true);

-- Driver location - managers
DROP POLICY IF EXISTS "Managers view driver location" ON driver_location_history;
CREATE POLICY "Managers view driver location" ON driver_location_history
    FOR SELECT USING (
        driver_id IN (
            SELECT id FROM drivers WHERE organization_id IN (
                SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- Cash movements - staff
DROP POLICY IF EXISTS "Staff view cash movements" ON cash_movements;
CREATE POLICY "Staff view cash movements" ON cash_movements FOR SELECT USING (true);

-- ============ FUNCTIONS ============

-- Open cash shift
CREATE OR REPLACE FUNCTION open_cash_shift(
    p_terminal_id UUID,
    p_opening_balance DECIMAL(12,2)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_org_id UUID;
    v_shift_id UUID;
BEGIN
    -- Get staff and org
    SELECT s.id, s.organization_id INTO v_staff_id, v_org_id
    FROM staff s WHERE s.user_id = auth.uid() AND s.is_active = true;
    
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'Staff record not found';
    END IF;
    
    -- Check for existing open shift
    IF EXISTS (SELECT 1 FROM cash_shifts WHERE terminal_id = p_terminal_id AND status = 'open') THEN
        RAISE EXCEPTION 'A shift is already open on this terminal';
    END IF;
    
    -- Create shift
    INSERT INTO cash_shifts (organization_id, terminal_id, staff_id, opening_balance)
    VALUES (v_org_id, p_terminal_id, v_staff_id, p_opening_balance)
    RETURNING id INTO v_shift_id;
    
    -- Update terminal
    UPDATE pos_terminals SET current_shift_id = v_shift_id WHERE id = p_terminal_id;
    
    -- Log audit
    PERFORM log_audit_event('open_shift', 'cash_shift', v_shift_id);
    
    RETURN v_shift_id;
END;
$$;

-- Close cash shift
CREATE OR REPLACE FUNCTION close_cash_shift(
    p_shift_id UUID,
    p_actual_cash DECIMAL(12,2),
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shift RECORD;
    v_expected_cash DECIMAL(12,2);
BEGIN
    SELECT * INTO v_shift FROM cash_shifts WHERE id = p_shift_id AND status = 'open';
    
    IF v_shift IS NULL THEN
        RAISE EXCEPTION 'Shift not found or already closed';
    END IF;
    
    -- Calculate expected cash
    v_expected_cash := v_shift.opening_balance + COALESCE(v_shift.cash_payments, 0) - COALESCE(
        (SELECT COALESCE(SUM(amount), 0) FROM cash_movements 
         WHERE shift_id = p_shift_id AND movement_type IN ('pay_out', 'drop')), 0
    );
    
    -- Update shift
    UPDATE cash_shifts SET
        closed_at = NOW(),
        closing_balance = p_actual_cash,
        expected_cash = v_expected_cash,
        actual_cash = p_actual_cash,
        variance = p_actual_cash - v_expected_cash,
        notes = p_notes,
        status = 'closed'
    WHERE id = p_shift_id;
    
    -- Clear terminal
    UPDATE pos_terminals SET current_shift_id = NULL WHERE current_shift_id = p_shift_id;
    
    -- Log audit
    PERFORM log_audit_event('close_shift', 'cash_shift', p_shift_id);
    
    RETURN true;
END;
$$;

-- Assign driver to order
CREATE OR REPLACE FUNCTION assign_driver(
    p_order_id UUID,
    p_driver_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    -- Check driver availability
    IF NOT EXISTS (SELECT 1 FROM drivers WHERE id = p_driver_id AND is_available = true AND is_active = true) THEN
        RAISE EXCEPTION 'Driver not available';
    END IF;
    
    -- Create assignment
    INSERT INTO driver_assignments (driver_id, order_id)
    VALUES (p_driver_id, p_order_id)
    ON CONFLICT (order_id) DO UPDATE SET
        driver_id = EXCLUDED.driver_id,
        status = 'assigned',
        assigned_at = NOW()
    RETURNING id INTO v_assignment_id;
    
    -- Log audit
    PERFORM log_audit_event('assign_driver', 'driver_assignment', v_assignment_id);
    
    RETURN v_assignment_id;
END;
$$;

-- Update driver location
CREATE OR REPLACE FUNCTION update_driver_location(
    p_driver_id UUID,
    p_latitude DECIMAL(10,7),
    p_longitude DECIMAL(10,7),
    p_accuracy DECIMAL(10,2) DEFAULT NULL,
    p_speed DECIMAL(10,2) DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_assignment UUID;
BEGIN
    -- Update driver current location
    UPDATE drivers SET
        current_location = jsonb_build_object(
            'lat', p_latitude,
            'lng', p_longitude,
            'updated_at', NOW()
        )
    WHERE id = p_driver_id;
    
    -- Get active assignment
    SELECT id INTO v_active_assignment
    FROM driver_assignments
    WHERE driver_id = p_driver_id AND status IN ('accepted', 'picked_up', 'en_route')
    LIMIT 1;
    
    -- Log location history
    INSERT INTO driver_location_history (driver_id, assignment_id, latitude, longitude, accuracy, speed)
    VALUES (p_driver_id, v_active_assignment, p_latitude, p_longitude, p_accuracy, p_speed);
END;
$$;

-- Update triggers
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
DROP TRIGGER IF EXISTS update_kds_stations_updated_at ON kds_stations;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
DROP TRIGGER IF EXISTS update_pos_terminals_updated_at ON pos_terminals;
DROP TRIGGER IF EXISTS update_printers_updated_at ON printers;

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kds_stations_updated_at BEFORE UPDATE ON kds_stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_terminals_updated_at BEFORE UPDATE ON pos_terminals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printers_updated_at BEFORE UPDATE ON printers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success
DO $$
BEGIN
    RAISE NOTICE 'Phase 6: Mobile Applications Support migration completed!';
END $$;
