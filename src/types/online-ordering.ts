// Phase 4: Online Ordering & Customer Experience Types

// ============ PAYMENTS ============

export type PaymentType = 'card' | 'upi' | 'wallet' | 'bank';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'online';
export type PaymentProvider = 'stripe' | 'razorpay' | 'paytm' | 'phonepe' | 'googlepay';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

export interface CustomerPaymentMethod {
    id: string;
    customer_id: string;
    payment_type: PaymentType;
    provider: PaymentProvider;
    token: string;
    last_four?: string;
    card_brand?: string;
    expiry_month?: number;
    expiry_year?: number;
    is_default: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface PaymentTransaction {
    id: string;
    organization_id: string;
    order_id: string;
    customer_id?: string;
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
    payment_provider?: PaymentProvider;
    provider_transaction_id?: string;
    provider_payment_id?: string;
    status: PaymentStatus;
    failure_reason?: string;
    metadata: Record<string, unknown>;
    refund_amount: number;
    refunded_at?: string;
    completed_at?: string;
    created_at: string;
}

export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

export interface Refund {
    id: string;
    organization_id: string;
    order_id: string;
    payment_transaction_id?: string;
    amount: number;
    reason: string;
    status: RefundStatus;
    processed_by?: string;
    processed_at?: string;
    provider_refund_id?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

// ============ PROMOTIONS ============

export type DiscountType = 'percentage' | 'fixed' | 'free_item' | 'bogo' | 'free_delivery';

export interface Promotion {
    id: string;
    organization_id: string;
    name: string;
    code: string;
    description?: string;
    discount_type: DiscountType;
    discount_value?: number;
    free_item_id?: string;
    minimum_order: number;
    maximum_discount?: number;
    usage_limit?: number;
    usage_count: number;
    per_customer_limit: number;
    valid_from: string;
    valid_until: string;
    applicable_to: {
        type: 'all' | 'category' | 'items';
        ids?: string[];
    };
    customer_criteria: {
        type?: 'all' | 'new' | 'loyalty_tier' | 'specific';
        loyalty_tier?: string;
        customer_ids?: string[];
    };
    is_active: boolean;
    requires_code: boolean;
    auto_apply: boolean;
    created_at: string;
    updated_at: string;
}

export interface PromotionUsage {
    id: string;
    promotion_id: string;
    order_id: string;
    customer_id?: string;
    discount_applied: number;
    created_at: string;
}

// ============ MARKETING ============

export type CampaignType = 'email' | 'sms' | 'push' | 'whatsapp';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export interface MarketingCampaign {
    id: string;
    organization_id: string;
    name: string;
    campaign_type: CampaignType;
    subject?: string;
    content: string;
    template_id?: string;
    target_audience: {
        type: 'all' | 'segment' | 'loyalty_tier' | 'specific';
        segment?: string;
        loyalty_tier?: string;
        customer_ids?: string[];
    };
    status: CampaignStatus;
    scheduled_for?: string;
    sent_at?: string;
    stats: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced?: number;
        unsubscribed?: number;
    };
    promotion_id?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export type PushPlatform = 'web' | 'ios' | 'android';

export interface PushToken {
    id: string;
    customer_id?: string;
    user_id?: string;
    token: string;
    platform: PushPlatform;
    device_info: Record<string, unknown>;
    is_active: boolean;
    last_used: string;
    created_at: string;
}

// ============ REVIEWS ============

export interface OrderReview {
    id: string;
    organization_id: string;
    order_id: string;
    customer_id?: string;
    overall_rating: number;
    food_rating?: number;
    delivery_rating?: number;
    packaging_rating?: number;
    review_text?: string;
    review_images?: string[];
    is_verified_purchase: boolean;
    is_approved: boolean;
    is_featured: boolean;
    response?: string;
    responded_by?: string;
    responded_at?: string;
    created_at: string;
    // Joined
    customer?: {
        name: string;
        avatar_url?: string;
    };
}

export interface MenuItemReview {
    id: string;
    menu_item_id: string;
    customer_id?: string;
    order_id?: string;
    rating: number;
    review_text?: string;
    is_approved: boolean;
    created_at: string;
    // Joined
    customer?: {
        name: string;
    };
}

// ============ INTEGRATIONS ============

export type IntegrationProvider =
    | 'stripe'
    | 'razorpay'
    | 'paytm'
    | 'swiggy'
    | 'zomato'
    | 'ubereats'
    | 'twilio'
    | 'sendgrid'
    | 'mailchimp';

export type IntegrationCategory = 'payment' | 'delivery' | 'communication' | 'analytics' | 'pos';

export interface Integration {
    id: string;
    organization_id: string;
    provider: IntegrationProvider;
    category: IntegrationCategory;
    is_enabled: boolean;
    is_test_mode: boolean;
    webhook_url?: string;
    settings: Record<string, unknown>;
    metadata: Record<string, unknown>;
    last_synced_at?: string;
    created_at: string;
    updated_at: string;
}

export type WebhookEventStatus = 'received' | 'processing' | 'processed' | 'failed';

export interface WebhookEvent {
    id: string;
    organization_id: string;
    integration_id?: string;
    provider: string;
    event_type: string;
    event_id?: string;
    payload: Record<string, unknown>;
    status: WebhookEventStatus;
    error_message?: string;
    processed_at?: string;
    created_at: string;
}

// ============ ONLINE ORDER ============

export type OrderSource = 'pos' | 'website' | 'app' | 'phone' | 'walk-in' | 'swiggy' | 'zomato' | 'ubereats' | 'dunzo';

export interface DeliveryAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    landmark?: string;
    lat?: number;
    lng?: number;
}

export interface OnlineOrder {
    id: string;
    organization_id: string;
    location_id?: string;
    customer_id?: string;
    source: OrderSource;
    delivery_address?: DeliveryAddress;
    scheduled_for?: string;
    is_scheduled: boolean;
    driver_id?: string;
    estimated_delivery?: string;
    actual_delivery?: string;
    delivery_notes?: string;
    external_order_id?: string;
    tip_amount: number;
    service_charge: number;
    packaging_charge: number;
    // From base order
    subtotal: number;
    tax: number;
    discount: number;
    delivery_fee: number;
    total: number;
    status: string;
    payment_status: string;
}

// ============ HELPERS ============

export function isPromotionValid(promotion: Promotion): boolean {
    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = new Date(promotion.valid_until);

    return (
        promotion.is_active &&
        now >= validFrom &&
        now <= validUntil &&
        (promotion.usage_limit === null || promotion.usage_count < promotion.usage_limit)
    );
}

export function calculateDiscount(
    promotion: Promotion,
    subtotal: number,
    deliveryFee: number = 0
): number {
    if (!isPromotionValid(promotion)) return 0;
    if (subtotal < promotion.minimum_order) return 0;

    let discount = 0;

    switch (promotion.discount_type) {
        case 'percentage':
            discount = subtotal * ((promotion.discount_value || 0) / 100);
            if (promotion.maximum_discount) {
                discount = Math.min(discount, promotion.maximum_discount);
            }
            break;
        case 'fixed':
            discount = promotion.discount_value || 0;
            break;
        case 'free_delivery':
            discount = deliveryFee;
            break;
        case 'bogo':
            // Handled separately based on items
            break;
    }

    return Math.min(discount, subtotal);
}

export function formatPaymentStatus(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
        pending: 'Pending',
        processing: 'Processing',
        completed: 'Completed',
        failed: 'Failed',
        refunded: 'Refunded',
        partially_refunded: 'Partially Refunded',
    };
    return statusMap[status] || status;
}

export function getPaymentStatusColor(status: PaymentStatus): string {
    const colorMap: Record<PaymentStatus, string> = {
        pending: 'yellow',
        processing: 'blue',
        completed: 'green',
        failed: 'red',
        refunded: 'purple',
        partially_refunded: 'orange',
    };
    return colorMap[status] || 'gray';
}
