# Enterprise SaaS Roadmap - KOTPro Restaurant Management System

## Overview
This document outlines the comprehensive plan to transform KOTPro from a single-restaurant application into an enterprise-grade multi-tenant SaaS platform.

**Backup Point**: `backup-before-saas-upgrade` (Git Tag)
**Start Date**: January 8, 2026

---

## Phase 1: Multi-Tenant Architecture & Organization Management
**Priority**: 🔴 Critical (Foundation)
**Estimated Duration**: 2-3 weeks

### 1.1 Database Schema Changes

#### New Tables Required:
```sql
-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#FF6B35',
    subscription_tier TEXT DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (Multi-location per org)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- location-specific overrides
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Members (linked to org + location)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    role TEXT NOT NULL, -- owner, manager, waiter, kitchen, cashier, delivery
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    hired_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Modify Existing Tables:
- Add `organization_id` to: menu_items, categories, orders, tables, customers, reservations
- Add `location_id` where applicable for multi-location support
- Implement Row Level Security (RLS) policies for tenant isolation

### 1.2 Frontend Changes

#### Context Providers:
```typescript
// New contexts needed:
- OrganizationContext (current org/tenant)
- LocationContext (current location within org)
- PermissionsContext (user permissions)
```

#### Components:
- Organization Switcher (for users with access to multiple orgs)
- Location Selector
- Organization Settings Page
- Branding Configuration UI

### 1.3 Implementation Tasks

| Task | Priority | Complexity | Status |
|------|----------|------------|--------|
| Create organizations table with RLS | High | Medium | ⬜ |
| Create locations table | High | Low | ⬜ |
| Modify existing tables to add org_id | High | High | ⬜ |
| Create OrganizationContext | High | Medium | ⬜ |
| Update all queries to filter by org | High | High | ⬜ |
| Organization onboarding flow | Medium | Medium | ⬜ |
| Organization settings UI | Medium | Medium | ⬜ |
| Custom branding support | Low | Low | ⬜ |

---

## Phase 2: Advanced User Management & Security
**Priority**: 🔴 Critical
**Estimated Duration**: 2 weeks

### 2.1 Role-Based Access Control (RBAC)

#### Permission Matrix:
```
Role        | Dashboard | POS | Kitchen | Menu | Reports | Settings | Staff
------------|-----------|-----|---------|------|---------|----------|-------
Owner       | ✅ Full   | ✅  | ✅      | ✅   | ✅      | ✅       | ✅
Manager     | ✅ Full   | ✅  | ✅      | ✅   | ✅      | ⚠️ Limited| ✅
Waiter      | ⚠️ Limited| ✅  | ❌      | ❌   | ❌      | ❌       | ❌
Kitchen     | ❌        | ❌  | ✅      | ⚠️ View| ❌     | ❌       | ❌
Cashier     | ⚠️ Limited| ✅  | ❌      | ❌   | ⚠️ Limited| ❌      | ❌
Delivery    | ❌        | ❌  | ❌      | ❌   | ❌      | ❌       | ❌
```

### 2.2 New Database Tables

```sql
-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    module TEXT NOT NULL -- dashboard, pos, kitchen, menu, etc.
);

-- Role Templates
CREATE TABLE role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    permissions TEXT[] NOT NULL,
    is_system BOOLEAN DEFAULT false
);

-- Staff Schedules
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'scheduled' -- scheduled, confirmed, completed, absent
);

-- Time Tracking
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    break_minutes INTEGER DEFAULT 0,
    notes TEXT
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Security Features

- [ ] Multi-factor authentication (TOTP)
- [ ] Session management & forced logout
- [ ] Password policies (strength, expiry)
- [ ] IP whitelisting (enterprise tier)
- [ ] Login attempt limiting

### 2.4 Implementation Tasks

| Task | Priority | Complexity | Status |
|------|----------|------------|--------|
| Create permissions system | High | High | ⬜ |
| Implement RBAC middleware | High | High | ⬜ |
| Staff scheduling UI | Medium | Medium | ⬜ |
| Time clock component | Medium | Low | ⬜ |
| Audit logging system | High | Medium | ⬜ |
| Performance tracking dashboard | Low | Medium | ⬜ |

---

## Phase 3: Enhanced Data Model & Features
**Priority**: 🟡 High
**Estimated Duration**: 3-4 weeks

### 3.1 Inventory Management

```sql
-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Inventory Items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    location_id UUID REFERENCES locations(id),
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    unit TEXT NOT NULL, -- kg, liters, pieces, etc.
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(10,3),
    cost_per_unit DECIMAL(10,2),
    supplier_id UUID REFERENCES suppliers(id),
    last_restocked TIMESTAMPTZ
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    supplier_id UUID REFERENCES suppliers(id),
    status TEXT DEFAULT 'draft', -- draft, ordered, received, cancelled
    total_amount DECIMAL(12,2),
    ordered_at TIMESTAMPTZ,
    expected_delivery DATE,
    received_at TIMESTAMPTZ
);

-- Stock Movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES inventory_items(id),
    movement_type TEXT NOT NULL, -- purchase, consumption, adjustment, waste
    quantity DECIMAL(10,3) NOT NULL,
    reference_id UUID, -- order_id, purchase_order_id, etc.
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Customer Loyalty & CRM

```sql
-- Customer Profiles (enhanced)
ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN tier TEXT DEFAULT 'bronze'; -- bronze, silver, gold, platinum
ALTER TABLE customers ADD COLUMN total_spent DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN visit_count INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN preferences JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN allergies TEXT[];
ALTER TABLE customers ADD COLUMN birthday DATE;

-- Loyalty Rules
CREATE TABLE loyalty_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    points_per_currency DECIMAL(5,2) DEFAULT 1, -- 1 point per ₹100
    redemption_rate DECIMAL(5,2) DEFAULT 0.25, -- ₹0.25 per point
    tier_thresholds JSONB -- {"silver": 1000, "gold": 5000, "platinum": 15000}
);

-- Customer Feedback
CREATE TABLE customer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    order_id UUID REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    food_rating INTEGER,
    service_rating INTEGER,
    ambiance_rating INTEGER,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Advanced Menu Management

```sql
-- Menu Item Variants
CREATE TABLE menu_item_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Small", "Large", "Family Pack"
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false
);

-- Modifiers & Add-ons
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL, -- "Extra Toppings", "Spice Level", "Cooking Style"
    selection_type TEXT DEFAULT 'multiple', -- single, multiple
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER,
    is_required BOOLEAN DEFAULT false
);

CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true
);

-- Menu Item Modifiers Link
CREATE TABLE menu_item_modifiers (
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_item_id, modifier_group_id)
);

-- Pricing Rules
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- time_based, day_based, customer_tier, bulk
    conditions JSONB NOT NULL,
    adjustment_type TEXT NOT NULL, -- percentage, fixed
    adjustment_value DECIMAL(10,2) NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ
);

-- Recipe Management
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    yield_quantity DECIMAL(10,2) DEFAULT 1,
    preparation_time INTEGER, -- minutes
    instructions TEXT
);

CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL
);
```

### 3.4 Reservation & Waitlist

```sql
-- Enhanced Reservations
ALTER TABLE reservations ADD COLUMN waitlist_position INTEGER;
ALTER TABLE reservations ADD COLUMN estimated_wait_minutes INTEGER;
ALTER TABLE reservations ADD COLUMN actual_seated_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN special_occasions TEXT;
ALTER TABLE reservations ADD COLUMN deposit_amount DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN deposit_paid BOOLEAN DEFAULT false;

-- Table Configurations
CREATE TABLE table_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    name TEXT NOT NULL, -- "Main Hall", "Rooftop", "Private Dining"
    capacity INTEGER,
    floor_plan JSONB -- visual layout data
);
```

### 3.5 Delivery Zone Management

```sql
-- Delivery Zones
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    name TEXT NOT NULL,
    polygon JSONB NOT NULL, -- GeoJSON coordinates
    minimum_order DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    estimated_time_minutes INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Delivery Partners
CREATE TABLE delivery_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL, -- Swiggy, Zomato, Dunzo, In-house
    api_key TEXT,
    webhook_url TEXT,
    commission_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true
);
```

---

## Implementation Priority Order

### Sprint 1 (Week 1-2): Foundation
1. ✅ Backup current state
2. ⬜ Create organizations & locations tables
3. ⬜ Implement OrganizationContext
4. ⬜ Add org_id to all existing tables
5. ⬜ Implement RLS policies

### Sprint 2 (Week 3-4): Authentication & Authorization
1. ⬜ Create staff & permissions tables
2. ⬜ Implement RBAC system
3. ⬜ Update ProtectedRoute with permissions
4. ⬜ Create audit logging

### Sprint 3 (Week 5-6): Core Features
1. ⬜ Inventory management system
2. ⬜ Recipe management
3. ⬜ Stock tracking

### Sprint 4 (Week 7-8): Customer & Menu
1. ⬜ Customer loyalty system
2. ⬜ Menu variants & modifiers
3. ⬜ Pricing rules engine

### Sprint 5 (Week 9-10): Operations
1. ⬜ Staff scheduling
2. ⬜ Enhanced reservations
3. ⬜ Delivery zone management

---

## Technical Considerations

### Database
- Use Supabase RLS for tenant isolation
- Implement database triggers for audit logging
- Consider read replicas for reporting (enterprise tier)

### Performance
- Implement query caching with React Query
- Use pagination for large datasets
- Implement virtual scrolling for long lists

### Security
- All API calls through Supabase with RLS
- Encrypt sensitive data (API keys, payment info)
- Regular security audits

### Scalability
- Stateless frontend (ready for CDN)
- Database connection pooling
- Background job processing for heavy operations

---

## Migration Strategy

1. **Development Environment**: Implement all changes
2. **Staging**: Full testing with sample data
3. **Production Migration**:
   - Create new tables first
   - Migrate existing data with default org
   - Enable new features gradually

---

## Success Metrics

- [ ] Multi-tenant isolation working
- [ ] All existing features work with org context
- [ ] RBAC prevents unauthorized access
- [ ] Audit logs capture all changes
- [ ] Performance remains under 200ms for page loads

---

**Next Steps**: Start with Phase 1.1 - Create organizations and locations tables with proper RLS policies.
