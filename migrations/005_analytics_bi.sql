-- =====================================================
-- PHASE 5: Advanced Analytics & Business Intelligence
-- Real-time Analytics, Forecasting, Reports
-- =====================================================

-- ============ ANALYTICS TABLES ============

-- 1. Daily Sales Summary (Pre-aggregated)
CREATE TABLE IF NOT EXISTS daily_sales_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    -- Orders
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    dine_in_orders INTEGER DEFAULT 0,
    takeaway_orders INTEGER DEFAULT 0,
    delivery_orders INTEGER DEFAULT 0,
    online_orders INTEGER DEFAULT 0,
    -- Revenue
    gross_revenue DECIMAL(14,2) DEFAULT 0,
    discounts DECIMAL(12,2) DEFAULT 0,
    refunds DECIMAL(12,2) DEFAULT 0,
    taxes DECIMAL(12,2) DEFAULT 0,
    tips DECIMAL(12,2) DEFAULT 0,
    delivery_fees DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(14,2) DEFAULT 0,
    -- Payments
    cash_payments DECIMAL(12,2) DEFAULT 0,
    card_payments DECIMAL(12,2) DEFAULT 0,
    upi_payments DECIMAL(12,2) DEFAULT 0,
    wallet_payments DECIMAL(12,2) DEFAULT 0,
    -- Customers
    unique_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    repeat_customers INTEGER DEFAULT 0,
    -- Metrics
    average_order_value DECIMAL(10,2) DEFAULT 0,
    average_items_per_order DECIMAL(5,2) DEFAULT 0,
    table_turnover_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, location_id, date)
);

-- 2. Hourly Sales (For peak hour analysis)
CREATE TABLE IF NOT EXISTS hourly_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    order_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, location_id, date, hour)
);

-- 3. Menu Item Performance
CREATE TABLE IF NOT EXISTS menu_item_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity_sold INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0, -- Unique orders containing this item
    average_rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    waste_quantity DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, menu_item_id, date)
);

-- 4. Category Performance
CREATE TABLE IF NOT EXISTS category_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    items_sold INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    average_order_contribution DECIMAL(5,2) DEFAULT 0, -- % of order total
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, category_id, date)
);

-- 5. Customer Analytics
CREATE TABLE IF NOT EXISTS customer_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    -- Lifetime metrics
    lifetime_value DECIMAL(14,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(14,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    average_items_per_order DECIMAL(5,2) DEFAULT 0,
    -- Frequency
    first_order_date DATE,
    last_order_date DATE,
    days_since_last_order INTEGER,
    average_days_between_orders DECIMAL(10,2),
    -- Preferences
    favorite_items TEXT[],
    favorite_categories TEXT[],
    preferred_order_time TEXT, -- 'lunch', 'dinner', 'late_night'
    preferred_order_day TEXT,
    preferred_payment_method TEXT,
    -- Engagement
    review_count INTEGER DEFAULT 0,
    average_rating_given DECIMAL(3,2),
    referrals_made INTEGER DEFAULT 0,
    -- Churn prediction
    churn_risk_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, customer_id)
);

-- 6. Staff Performance Analytics
CREATE TABLE IF NOT EXISTS staff_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Orders
    orders_handled INTEGER DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,
    order_errors INTEGER DEFAULT 0,
    -- Revenue
    total_sales DECIMAL(12,2) DEFAULT 0,
    tips_earned DECIMAL(10,2) DEFAULT 0,
    -- Time
    hours_worked DECIMAL(5,2) DEFAULT 0,
    break_time_minutes INTEGER DEFAULT 0,
    late_clock_ins INTEGER DEFAULT 0,
    -- Tables (for waiters)
    tables_served INTEGER DEFAULT 0,
    average_table_time INTEGER, -- minutes
    -- Ratings
    customer_ratings_count INTEGER DEFAULT 0,
    average_customer_rating DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, staff_id, date)
);

-- 7. Inventory Analytics
CREATE TABLE IF NOT EXISTS inventory_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_stock DECIMAL(12,3) DEFAULT 0,
    received DECIMAL(12,3) DEFAULT 0,
    consumed DECIMAL(12,3) DEFAULT 0,
    wasted DECIMAL(12,3) DEFAULT 0,
    closing_stock DECIMAL(12,3) DEFAULT 0,
    cost_of_goods DECIMAL(12,2) DEFAULT 0,
    wastage_value DECIMAL(10,2) DEFAULT 0,
    stock_days_remaining DECIMAL(5,1), -- At current consumption rate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, inventory_item_id, date)
);

-- 8. Saved Reports
CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL, -- 'sales', 'inventory', 'staff', 'customer', 'custom'
    config JSONB NOT NULL, -- Report configuration
    schedule TEXT, -- 'daily', 'weekly', 'monthly', NULL for manual
    recipients TEXT[],
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Report Exports
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    saved_report_id UUID REFERENCES saved_reports(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
    file_url TEXT,
    file_size INTEGER,
    parameters JSONB DEFAULT '{}',
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    error_message TEXT,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL, -- 'sales_today', 'order_count', 'revenue_chart', etc.
    title TEXT,
    position JSONB DEFAULT '{"x": 0, "y": 0, "w": 2, "h": 2}',
    config JSONB DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_daily_sales_org_date ON daily_sales_summary(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_sales_org_date ON hourly_sales(organization_id, date, hour);
CREATE INDEX IF NOT EXISTS idx_menu_item_analytics_date ON menu_item_analytics(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_category_analytics_date ON category_analytics(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_org ON customer_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_ltv ON customer_analytics(lifetime_value DESC);
CREATE INDEX IF NOT EXISTS idx_staff_analytics_date ON staff_analytics(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_analytics_date ON inventory_analytics(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_saved_reports_org ON saved_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_org ON report_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON dashboard_widgets(user_id);

-- ============ RLS ============

ALTER TABLE daily_sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
DECLARE
    tbl TEXT;
    tables_list TEXT[] := ARRAY[
        'daily_sales_summary', 'hourly_sales', 'menu_item_analytics', 
        'category_analytics', 'customer_analytics', 'staff_analytics',
        'inventory_analytics', 'saved_reports', 'report_exports'
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

-- Dashboard widgets - users see their own
DROP POLICY IF EXISTS "Users view own widgets" ON dashboard_widgets;
CREATE POLICY "Users view own widgets" ON dashboard_widgets
    FOR ALL USING (user_id = auth.uid());

-- ============ ANALYTICS FUNCTIONS ============

-- Update daily sales summary
CREATE OR REPLACE FUNCTION update_daily_sales_summary(
    p_organization_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_summary RECORD;
BEGIN
    -- Calculate summary
    SELECT
        COUNT(*) FILTER (WHERE true) as total_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE order_type = 'dine-in') as dine_in_orders,
        COUNT(*) FILTER (WHERE order_type = 'takeaway') as takeaway_orders,
        COUNT(*) FILTER (WHERE order_type = 'delivery') as delivery_orders,
        COUNT(*) FILTER (WHERE source IN ('website', 'app')) as online_orders,
        COALESCE(SUM(subtotal), 0) as gross_revenue,
        COALESCE(SUM(discount), 0) as discounts,
        COALESCE(SUM(tax), 0) as taxes,
        COALESCE(SUM(tip_amount), 0) as tips,
        COALESCE(SUM(total) - SUM(COALESCE(discount, 0)), 0) as net_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_payments,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_payments,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN total ELSE 0 END), 0) as upi_payments,
        COUNT(DISTINCT customer_id) as unique_customers,
        CASE WHEN COUNT(*) > 0 THEN SUM(total) / COUNT(*) ELSE 0 END as average_order_value
    INTO v_summary
    FROM orders
    WHERE organization_id = p_organization_id
    AND DATE(created_at) = p_date;
    
    -- Upsert summary
    INSERT INTO daily_sales_summary (
        organization_id, date, total_orders, completed_orders, cancelled_orders,
        dine_in_orders, takeaway_orders, delivery_orders, online_orders,
        gross_revenue, discounts, taxes, tips, net_revenue,
        cash_payments, card_payments, upi_payments,
        unique_customers, average_order_value
    ) VALUES (
        p_organization_id, p_date, v_summary.total_orders, v_summary.completed_orders,
        v_summary.cancelled_orders, v_summary.dine_in_orders, v_summary.takeaway_orders,
        v_summary.delivery_orders, v_summary.online_orders,
        v_summary.gross_revenue, v_summary.discounts, v_summary.taxes, v_summary.tips,
        v_summary.net_revenue, v_summary.cash_payments, v_summary.card_payments,
        v_summary.upi_payments, v_summary.unique_customers, v_summary.average_order_value
    )
    ON CONFLICT (organization_id, location_id, date) 
    DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        completed_orders = EXCLUDED.completed_orders,
        cancelled_orders = EXCLUDED.cancelled_orders,
        dine_in_orders = EXCLUDED.dine_in_orders,
        takeaway_orders = EXCLUDED.takeaway_orders,
        delivery_orders = EXCLUDED.delivery_orders,
        online_orders = EXCLUDED.online_orders,
        gross_revenue = EXCLUDED.gross_revenue,
        discounts = EXCLUDED.discounts,
        taxes = EXCLUDED.taxes,
        tips = EXCLUDED.tips,
        net_revenue = EXCLUDED.net_revenue,
        cash_payments = EXCLUDED.cash_payments,
        card_payments = EXCLUDED.card_payments,
        upi_payments = EXCLUDED.upi_payments,
        unique_customers = EXCLUDED.unique_customers,
        average_order_value = EXCLUDED.average_order_value,
        updated_at = NOW();
END;
$$;

-- Get sales trends
CREATE OR REPLACE FUNCTION get_sales_trends(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_granularity TEXT DEFAULT 'day' -- 'day', 'week', 'month'
)
RETURNS TABLE (
    period TEXT,
    total_orders INTEGER,
    revenue DECIMAL(14,2),
    average_order_value DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE p_granularity
            WHEN 'day' THEN TO_CHAR(dss.date, 'YYYY-MM-DD')
            WHEN 'week' THEN TO_CHAR(date_trunc('week', dss.date), 'YYYY-"W"IW')
            WHEN 'month' THEN TO_CHAR(dss.date, 'YYYY-MM')
        END as period,
        SUM(dss.total_orders)::INTEGER as total_orders,
        SUM(dss.net_revenue) as revenue,
        CASE WHEN SUM(dss.total_orders) > 0 
            THEN SUM(dss.net_revenue) / SUM(dss.total_orders)
            ELSE 0 
        END as average_order_value
    FROM daily_sales_summary dss
    WHERE dss.organization_id = p_organization_id
    AND dss.date BETWEEN p_start_date AND p_end_date
    GROUP BY 1
    ORDER BY 1;
END;
$$;

-- Get top selling items
CREATE OR REPLACE FUNCTION get_top_selling_items(
    p_organization_id UUID,
    p_start_date DATE DEFAULT (NOW() - INTERVAL '30 days')::DATE,
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    menu_item_id UUID,
    item_name TEXT,
    category_name TEXT,
    quantity_sold BIGINT,
    revenue DECIMAL(14,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id as menu_item_id,
        mi.name as item_name,
        c.name as category_name,
        SUM(mia.quantity_sold)::BIGINT as quantity_sold,
        SUM(mia.revenue) as revenue
    FROM menu_item_analytics mia
    JOIN menu_items mi ON mi.id = mia.menu_item_id
    LEFT JOIN categories c ON c.id = mi.category_id
    WHERE mia.organization_id = p_organization_id
    AND mia.date BETWEEN p_start_date AND p_end_date
    GROUP BY mi.id, mi.name, c.name
    ORDER BY quantity_sold DESC
    LIMIT p_limit;
END;
$$;

-- Get customer lifetime value segments
CREATE OR REPLACE FUNCTION get_customer_segments(
    p_organization_id UUID
)
RETURNS TABLE (
    segment TEXT,
    customer_count BIGINT,
    total_revenue DECIMAL(14,2),
    avg_order_value DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ca.lifetime_value >= 50000 THEN 'VIP'
            WHEN ca.lifetime_value >= 20000 THEN 'High Value'
            WHEN ca.lifetime_value >= 5000 THEN 'Regular'
            ELSE 'Occasional'
        END as segment,
        COUNT(*)::BIGINT as customer_count,
        SUM(ca.total_spent) as total_revenue,
        AVG(ca.average_order_value) as avg_order_value
    FROM customer_analytics ca
    WHERE ca.organization_id = p_organization_id
    GROUP BY 1
    ORDER BY total_revenue DESC;
END;
$$;

-- Get peak hours
CREATE OR REPLACE FUNCTION get_peak_hours(
    p_organization_id UUID,
    p_start_date DATE DEFAULT (NOW() - INTERVAL '30 days')::DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    hour INTEGER,
    avg_orders DECIMAL(10,2),
    avg_revenue DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hs.hour,
        AVG(hs.order_count)::DECIMAL(10,2) as avg_orders,
        AVG(hs.revenue)::DECIMAL(12,2) as avg_revenue
    FROM hourly_sales hs
    WHERE hs.organization_id = p_organization_id
    AND hs.date BETWEEN p_start_date AND p_end_date
    GROUP BY hs.hour
    ORDER BY avg_revenue DESC;
END;
$$;

-- Update triggers
DROP TRIGGER IF EXISTS update_daily_sales_updated_at ON daily_sales_summary;
DROP TRIGGER IF EXISTS update_saved_reports_updated_at ON saved_reports;
DROP TRIGGER IF EXISTS update_dashboard_widgets_updated_at ON dashboard_widgets;
DROP TRIGGER IF EXISTS update_customer_analytics_updated_at ON customer_analytics;

CREATE TRIGGER update_daily_sales_updated_at BEFORE UPDATE ON daily_sales_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_reports_updated_at BEFORE UPDATE ON saved_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_analytics_updated_at BEFORE UPDATE ON customer_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success
DO $$
BEGIN
    RAISE NOTICE 'Phase 5: Advanced Analytics & Business Intelligence migration completed!';
END $$;
