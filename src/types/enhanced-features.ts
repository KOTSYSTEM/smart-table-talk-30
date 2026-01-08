// Enhanced Data Model Types - Inventory, Loyalty, Menu, Recipes

// ============ INVENTORY ============

export interface Supplier {
    id: string;
    organization_id: string;
    name: string;
    code?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    gst_number?: string;
    payment_terms: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface InventoryItem {
    id: string;
    organization_id: string;
    location_id?: string;
    name: string;
    sku?: string;
    category?: string;
    unit: string;
    current_stock: number;
    min_stock_level: number;
    max_stock_level?: number;
    reorder_level?: number;
    cost_per_unit: number;
    supplier_id?: string;
    storage_location?: string;
    expiry_tracking: boolean;
    is_active: boolean;
    last_restocked?: string;
    created_at: string;
    updated_at: string;
    // Joined
    supplier?: Supplier;
}

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrder {
    id: string;
    organization_id: string;
    location_id?: string;
    supplier_id?: string;
    order_number: string;
    status: PurchaseOrderStatus;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    notes?: string;
    ordered_at?: string;
    expected_delivery?: string;
    received_at?: string;
    created_by?: string;
    approved_by?: string;
    created_at: string;
    updated_at: string;
    // Joined
    supplier?: Supplier;
    items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    inventory_item_id: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    // Joined
    inventory_item?: InventoryItem;
}

export type StockMovementType = 'purchase' | 'consumption' | 'adjustment' | 'waste' | 'transfer' | 'return';

export interface StockMovement {
    id: string;
    organization_id: string;
    inventory_item_id: string;
    movement_type: StockMovementType;
    quantity: number;
    unit_cost?: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
    // Joined
    inventory_item?: InventoryItem;
}

// ============ LOYALTY & CRM ============

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CustomerEnhanced {
    id: string;
    organization_id: string;
    name: string;
    email?: string;
    phone?: string;
    loyalty_points: number;
    loyalty_tier: LoyaltyTier;
    total_spent: number;
    total_orders: number;
    average_order_value: number;
    preferences: Record<string, unknown>;
    allergies?: string[];
    dietary_restrictions?: string[];
    birthday?: string;
    anniversary?: string;
    notes?: string;
}

export interface LoyaltyRule {
    id: string;
    organization_id: string;
    name: string;
    is_active: boolean;
    points_per_currency: number;
    redemption_rate: number;
    min_redemption_points: number;
    tier_thresholds: {
        silver: number;
        gold: number;
        platinum: number;
    };
    tier_benefits: Record<LoyaltyTier, string[]>;
    bonus_rules: BonusRule[];
    created_at: string;
    updated_at: string;
}

export interface BonusRule {
    type: 'birthday' | 'signup' | 'referral' | 'anniversary';
    points: number;
    description?: string;
}

export type LoyaltyTransactionType = 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjust';

export interface LoyaltyTransaction {
    id: string;
    organization_id: string;
    customer_id: string;
    order_id?: string;
    transaction_type: LoyaltyTransactionType;
    points: number;
    balance_after: number;
    description?: string;
    expires_at?: string;
    created_at: string;
}

export interface CustomerFeedback {
    id: string;
    organization_id: string;
    customer_id?: string;
    order_id?: string;
    overall_rating: number;
    food_rating?: number;
    service_rating?: number;
    ambiance_rating?: number;
    value_rating?: number;
    comments?: string;
    would_recommend?: boolean;
    staff_id?: string;
    response?: string;
    responded_at?: string;
    responded_by?: string;
    created_at: string;
}

// ============ MENU MANAGEMENT ============

export interface MenuItemVariant {
    id: string;
    menu_item_id: string;
    name: string;
    sku?: string;
    price: number;
    cost: number;
    is_default: boolean;
    is_available: boolean;
    sort_order: number;
    created_at: string;
}

export type SelectionType = 'single' | 'multiple';

export interface ModifierGroup {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    selection_type: SelectionType;
    min_selections: number;
    max_selections?: number;
    is_required: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    // Joined
    modifiers?: Modifier[];
}

export interface Modifier {
    id: string;
    group_id: string;
    name: string;
    price: number;
    cost: number;
    is_available: boolean;
    is_default: boolean;
    sort_order: number;
    created_at: string;
}

export type PricingRuleType = 'time_based' | 'day_based' | 'customer_tier' | 'quantity' | 'combo' | 'happy_hour';
export type AdjustmentType = 'percentage' | 'fixed' | 'new_price';

export interface PricingRule {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    rule_type: PricingRuleType;
    conditions: PricingConditions;
    adjustment_type: AdjustmentType;
    adjustment_value: number;
    applies_to: {
        type: 'all' | 'category' | 'items';
        ids?: string[];
    };
    priority: number;
    is_active: boolean;
    valid_from?: string;
    valid_until?: string;
    created_at: string;
    updated_at: string;
}

export interface PricingConditions {
    days?: string[]; // ['monday', 'tuesday']
    start_time?: string; // '17:00'
    end_time?: string; // '20:00'
    min_quantity?: number;
    customer_tier?: LoyaltyTier;
}

// ============ RECIPES ============

export interface Recipe {
    id: string;
    organization_id: string;
    menu_item_id?: string;
    menu_item_variant_id?: string;
    name: string;
    description?: string;
    yield_quantity: number;
    yield_unit: string;
    preparation_time?: number;
    cooking_time?: number;
    instructions?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Computed
    total_cost?: number;
    // Joined
    ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
    id: string;
    recipe_id: string;
    inventory_item_id: string;
    quantity: number;
    unit: string;
    notes?: string;
    is_optional: boolean;
    sort_order: number;
    // Joined
    inventory_item?: InventoryItem;
    // Computed
    cost?: number;
}

// ============ DELIVERY ============

export interface DeliveryZone {
    id: string;
    location_id: string;
    name: string;
    description?: string;
    polygon?: GeoJSON.Polygon;
    pincodes?: string[];
    minimum_order: number;
    delivery_fee: number;
    free_delivery_above?: number;
    estimated_time_minutes: number;
    is_active: boolean;
    created_at: string;
}

export type PartnerType = 'in_house' | 'third_party' | 'hybrid';

export interface DeliveryPartner {
    id: string;
    organization_id: string;
    name: string;
    partner_type: PartnerType;
    api_endpoint?: string;
    webhook_url?: string;
    commission_percentage?: number;
    commission_fixed?: number;
    is_active: boolean;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ============ TABLE SECTIONS ============

export interface TableSection {
    id: string;
    location_id: string;
    name: string;
    description?: string;
    capacity?: number;
    is_smoking: boolean;
    is_outdoor: boolean;
    is_private: boolean;
    min_spend?: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

// ============ HELPER FUNCTIONS ============

export function calculateLoyaltyPoints(amount: number, pointsPerCurrency: number): number {
    return Math.floor(amount * pointsPerCurrency / 100);
}

export function calculateRedemptionValue(points: number, redemptionRate: number): number {
    return points * redemptionRate;
}

export function getLoyaltyTier(points: number, thresholds: LoyaltyRule['tier_thresholds']): LoyaltyTier {
    if (points >= thresholds.platinum) return 'platinum';
    if (points >= thresholds.gold) return 'gold';
    if (points >= thresholds.silver) return 'silver';
    return 'bronze';
}

export function isLowStock(item: InventoryItem): boolean {
    return item.current_stock <= (item.min_stock_level || 0);
}

export function needsReorder(item: InventoryItem): boolean {
    return item.reorder_level !== undefined && item.current_stock <= item.reorder_level;
}
