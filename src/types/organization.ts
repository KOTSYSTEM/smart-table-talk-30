// Organization & Multi-Tenant Types

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    subscription_tier: 'starter' | 'professional' | 'enterprise';
    subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
    trial_ends_at?: string;
    settings: OrganizationSettings;
    billing_email?: string;
    billing_address?: BillingAddress;
    created_at: string;
    updated_at: string;
}

export interface OrganizationSettings {
    currency: string;
    timezone: string;
    date_format: string;
    time_format: '12h' | '24h';
    tax_inclusive: boolean;
    default_tax_rate: number;
    order_prefix: string;
    invoice_prefix: string;
}

export interface BillingAddress {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
}

export interface Location {
    id: string;
    organization_id: string;
    name: string;
    code?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country: string;
    phone?: string;
    email?: string;
    timezone: string;
    is_active: boolean;
    is_primary: boolean;
    opening_time: string;
    closing_time: string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    created_at: string;
    updated_at: string;
}

export type StaffRole = 'owner' | 'manager' | 'waiter' | 'kitchen' | 'cashier' | 'delivery';

export interface Staff {
    id: string;
    user_id?: string;
    organization_id: string;
    location_id?: string;
    employee_code?: string;
    full_name: string;
    email?: string;
    phone?: string;
    role: StaffRole;
    permissions: string[];
    hourly_rate?: number;
    is_active: boolean;
    hired_date: string;
    pin_code?: string;
    created_at: string;
    updated_at: string;
}

// Permission Types
export type Permission =
    | 'dashboard.view'
    | 'dashboard.analytics'
    | 'pos.view'
    | 'pos.create_order'
    | 'pos.void_order'
    | 'pos.apply_discount'
    | 'kitchen.view'
    | 'kitchen.update_status'
    | 'menu.view'
    | 'menu.create'
    | 'menu.edit'
    | 'menu.delete'
    | 'tables.view'
    | 'tables.manage'
    | 'orders.view'
    | 'orders.edit'
    | 'orders.delete'
    | 'customers.view'
    | 'customers.create'
    | 'customers.edit'
    | 'reservations.view'
    | 'reservations.create'
    | 'reservations.edit'
    | 'reports.view'
    | 'reports.export'
    | 'settings.view'
    | 'settings.edit'
    | 'staff.view'
    | 'staff.create'
    | 'staff.edit'
    | 'staff.delete';

// Role Permission Mapping
export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
    owner: [
        'dashboard.view', 'dashboard.analytics',
        'pos.view', 'pos.create_order', 'pos.void_order', 'pos.apply_discount',
        'kitchen.view', 'kitchen.update_status',
        'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
        'tables.view', 'tables.manage',
        'orders.view', 'orders.edit', 'orders.delete',
        'customers.view', 'customers.create', 'customers.edit',
        'reservations.view', 'reservations.create', 'reservations.edit',
        'reports.view', 'reports.export',
        'settings.view', 'settings.edit',
        'staff.view', 'staff.create', 'staff.edit', 'staff.delete'
    ],
    manager: [
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
        'staff.view', 'staff.create', 'staff.edit'
    ],
    waiter: [
        'dashboard.view',
        'pos.view', 'pos.create_order',
        'tables.view', 'tables.manage',
        'orders.view',
        'reservations.view', 'reservations.create'
    ],
    kitchen: [
        'kitchen.view', 'kitchen.update_status',
        'menu.view',
        'orders.view'
    ],
    cashier: [
        'dashboard.view',
        'pos.view', 'pos.create_order',
        'orders.view',
        'reports.view'
    ],
    delivery: [
        'orders.view'
    ]
};

// Helper function to check permission
export function hasPermission(role: StaffRole, permission: Permission, additionalPermissions: string[] = []): boolean {
    if (role === 'owner') return true;
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    return rolePerms.includes(permission) || additionalPermissions.includes(permission);
}
