-- =====================================================
-- PHASE 4: Online Ordering & Customer Experience
-- Customer Portal, Payments, Marketing
-- =====================================================

-- ============ CUSTOMER ACCOUNTS ============

-- 1. Customer Authentication (linked to auth.users)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT,
ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]';

-- 2. Customer Saved Cards (tokenized)
CREATE TABLE IF NOT EXISTS customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'upi', 'wallet', 'bank')),
    provider TEXT NOT NULL, -- 'stripe', 'razorpay', 'paytm', etc.
    token TEXT NOT NULL, -- Tokenized payment method ID
    last_four TEXT,
    card_brand TEXT, -- visa, mastercard, rupay
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ONLINE ORDERING ============

-- 3. Order Sources (expanded)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'pos' CHECK (source IN ('pos', 'website', 'app', 'phone', 'walk-in', 'swiggy', 'zomato', 'ubereats', 'dunzo')),
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_address JSONB,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS driver_id UUID,
ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS external_order_id TEXT, -- ID from third-party platform
ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS packaging_charge DECIMAL(10,2) DEFAULT 0;

-- 4. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL, -- 'cash', 'card', 'upi', 'wallet', 'online'
    payment_provider TEXT, -- 'stripe', 'razorpay', 'paytm', 'phonepe'
    provider_transaction_id TEXT,
    provider_payment_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    refund_amount DECIMAL(12,2) DEFAULT 0,
    refunded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    provider_refund_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PROMOTIONS & MARKETING ============

-- 6. Promotions/Coupons
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_item', 'bogo', 'free_delivery')),
    discount_value DECIMAL(10,2),
    free_item_id UUID REFERENCES menu_items(id),
    minimum_order DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    applicable_to JSONB DEFAULT '{"type": "all"}', -- all, category, items
    customer_criteria JSONB DEFAULT '{}', -- new, loyalty_tier, specific
    is_active BOOLEAN DEFAULT true,
    requires_code BOOLEAN DEFAULT true,
    auto_apply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 7. Promotion Usage Tracking
CREATE TABLE IF NOT EXISTS promotion_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    discount_applied DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push', 'whatsapp')),
    subject TEXT,
    content TEXT NOT NULL,
    template_id TEXT, -- External template ID
    target_audience JSONB DEFAULT '{"type": "all"}', -- all, segment, loyalty_tier
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0}',
    promotion_id UUID REFERENCES promotions(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Push Notification Tokens
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token)
);

-- ============ RATINGS & REVIEWS ============

-- 10. Order Reviews
CREATE TABLE IF NOT EXISTS order_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    packaging_rating INTEGER CHECK (packaging_rating >= 1 AND packaging_rating <= 5),
    review_text TEXT,
    review_images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    response TEXT,
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Menu Item Reviews
CREATE TABLE IF NOT EXISTS menu_item_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ THIRD-PARTY INTEGRATIONS ============

-- 12. Integration Configurations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'stripe', 'razorpay', 'swiggy', 'zomato', 'twilio', 'sendgrid'
    category TEXT NOT NULL CHECK (category IN ('payment', 'delivery', 'communication', 'analytics', 'pos')),
    is_enabled BOOLEAN DEFAULT false,
    is_test_mode BOOLEAN DEFAULT true,
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    webhook_url TEXT,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, provider)
);

-- 13. Webhook Events
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_customer_payment_methods ON customer_payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_promotions_org ON promotions(organization_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotion_usages ON promotion_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org ON marketing_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_customer ON push_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_org ON order_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_order ON order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_reviews_item ON menu_item_reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ============ RLS POLICIES ============

ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Customer can view their own payment methods
DROP POLICY IF EXISTS "Customers view own payment methods" ON customer_payment_methods;
CREATE POLICY "Customers view own payment methods" ON customer_payment_methods
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- Staff can view org payment transactions
DROP POLICY IF EXISTS "Staff view payment transactions" ON payment_transactions;
CREATE POLICY "Staff view payment transactions" ON payment_transactions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Staff can view org refunds
DROP POLICY IF EXISTS "Staff view refunds" ON refunds;
CREATE POLICY "Staff view refunds" ON refunds
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Staff can view org promotions
DROP POLICY IF EXISTS "Staff view promotions" ON promotions;
CREATE POLICY "Staff view promotions" ON promotions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Public can view active promotions (for customer ordering)
DROP POLICY IF EXISTS "Public view active promotions" ON promotions;
CREATE POLICY "Public view active promotions" ON promotions
    FOR SELECT USING (is_active = true AND valid_until > NOW());

-- Staff view campaigns
DROP POLICY IF EXISTS "Staff view campaigns" ON marketing_campaigns;
CREATE POLICY "Staff view campaigns" ON marketing_campaigns
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Customers manage own push tokens
DROP POLICY IF EXISTS "Customers manage push tokens" ON push_tokens;
CREATE POLICY "Customers manage push tokens" ON push_tokens
    FOR ALL USING (user_id = auth.uid() OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Public can view approved reviews
DROP POLICY IF EXISTS "Public view approved reviews" ON order_reviews;
CREATE POLICY "Public view approved reviews" ON order_reviews
    FOR SELECT USING (is_approved = true);

-- Staff can view all org reviews
DROP POLICY IF EXISTS "Staff view org reviews" ON order_reviews;
CREATE POLICY "Staff view org reviews" ON order_reviews
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
    );

-- Public view approved item reviews
DROP POLICY IF EXISTS "Public view item reviews" ON menu_item_reviews;
CREATE POLICY "Public view item reviews" ON menu_item_reviews
    FOR SELECT USING (is_approved = true);

-- Managers view integrations
DROP POLICY IF EXISTS "Managers view integrations" ON integrations;
CREATE POLICY "Managers view integrations" ON integrations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM staff 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'manager')
        )
    );

-- Staff view promotion usages
DROP POLICY IF EXISTS "Staff view promotion usages" ON promotion_usages;
CREATE POLICY "Staff view promotion usages" ON promotion_usages
    FOR SELECT USING (true);

-- Staff view webhook events
DROP POLICY IF EXISTS "Staff view webhooks" ON webhook_events;
CREATE POLICY "Staff view webhooks" ON webhook_events
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM staff 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'manager')
        )
    );

-- ============ FUNCTIONS ============

-- Apply promotion to order
CREATE OR REPLACE FUNCTION apply_promotion(
    p_order_id UUID,
    p_promotion_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_promotion RECORD;
    v_order RECORD;
    v_discount DECIMAL(10,2);
    v_customer_usage INTEGER;
BEGIN
    -- Get order
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF v_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Get promotion
    SELECT * INTO v_promotion FROM promotions 
    WHERE code = UPPER(p_promotion_code) 
    AND organization_id = v_order.organization_id
    AND is_active = true
    AND valid_from <= NOW()
    AND valid_until > NOW();
    
    IF v_promotion IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired promotion code');
    END IF;
    
    -- Check usage limit
    IF v_promotion.usage_limit IS NOT NULL AND v_promotion.usage_count >= v_promotion.usage_limit THEN
        RETURN jsonb_build_object('success', false, 'error', 'Promotion usage limit reached');
    END IF;
    
    -- Check per-customer limit
    IF v_order.customer_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_customer_usage FROM promotion_usages 
        WHERE promotion_id = v_promotion.id AND customer_id = v_order.customer_id;
        
        IF v_customer_usage >= v_promotion.per_customer_limit THEN
            RETURN jsonb_build_object('success', false, 'error', 'You have already used this promotion');
        END IF;
    END IF;
    
    -- Check minimum order
    IF v_order.total < v_promotion.minimum_order THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order does not meet minimum amount');
    END IF;
    
    -- Calculate discount
    CASE v_promotion.discount_type
        WHEN 'percentage' THEN
            v_discount := v_order.subtotal * (v_promotion.discount_value / 100);
            IF v_promotion.maximum_discount IS NOT NULL THEN
                v_discount := LEAST(v_discount, v_promotion.maximum_discount);
            END IF;
        WHEN 'fixed' THEN
            v_discount := v_promotion.discount_value;
        WHEN 'free_delivery' THEN
            v_discount := COALESCE(v_order.delivery_fee, 0);
        ELSE
            v_discount := 0;
    END CASE;
    
    -- Update order with discount
    UPDATE orders SET 
        discount = COALESCE(discount, 0) + v_discount,
        total = total - v_discount
    WHERE id = p_order_id;
    
    -- Record usage
    INSERT INTO promotion_usages (promotion_id, order_id, customer_id, discount_applied)
    VALUES (v_promotion.id, p_order_id, v_order.customer_id, v_discount);
    
    -- Update promotion usage count
    UPDATE promotions SET usage_count = usage_count + 1 WHERE id = v_promotion.id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'discount', v_discount,
        'promotion_name', v_promotion.name
    );
END;
$$;

-- Create payment transaction
CREATE OR REPLACE FUNCTION create_payment_transaction(
    p_order_id UUID,
    p_amount DECIMAL(12,2),
    p_payment_method TEXT,
    p_provider TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_transaction_id UUID;
BEGIN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    INSERT INTO payment_transactions (
        organization_id, order_id, customer_id, amount, 
        payment_method, payment_provider, status
    ) VALUES (
        v_order.organization_id, p_order_id, v_order.customer_id, p_amount,
        p_payment_method, p_provider, 'pending'
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Complete payment
CREATE OR REPLACE FUNCTION complete_payment(
    p_transaction_id UUID,
    p_provider_transaction_id TEXT DEFAULT NULL,
    p_provider_payment_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
BEGIN
    UPDATE payment_transactions SET
        status = 'completed',
        provider_transaction_id = p_provider_transaction_id,
        provider_payment_id = p_provider_payment_id,
        completed_at = NOW()
    WHERE id = p_transaction_id
    RETURNING * INTO v_transaction;
    
    IF v_transaction IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update order payment status
    UPDATE orders SET payment_status = 'paid' WHERE id = v_transaction.order_id;
    
    -- Log audit event
    PERFORM log_audit_event('payment_completed', 'payment_transaction', p_transaction_id);
    
    RETURN true;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success
DO $$
BEGIN
    RAISE NOTICE 'Phase 4: Online Ordering & Customer Experience migration completed!';
END $$;
