// Advanced User Management & Security Types

export interface Permission {
    id: string;
    code: string;
    name: string;
    description?: string;
    module: string;
    created_at: string;
}

export interface RoleTemplate {
    id: string;
    organization_id?: string;
    name: string;
    description?: string;
    permissions: string[];
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'cancelled';

export interface StaffSchedule {
    id: string;
    staff_id: string;
    location_id?: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    status: ScheduleStatus;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    staff?: {
        full_name: string;
        role: string;
    };
    location?: {
        name: string;
    };
}

export type TimeEntryStatus = 'clocked_in' | 'on_break' | 'clocked_out';

export interface TimeEntry {
    id: string;
    staff_id: string;
    location_id?: string;
    clock_in: string;
    clock_out?: string;
    break_start?: string;
    break_end?: string;
    total_break_minutes: number;
    status: TimeEntryStatus;
    notes?: string;
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    // Joined fields
    staff?: {
        full_name: string;
        role: string;
    };
}

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'clock_in'
    | 'clock_out'
    | 'view'
    | 'export';

export interface AuditLog {
    id: string;
    organization_id?: string;
    user_id?: string;
    staff_id?: string;
    action: AuditAction;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    // Joined fields
    staff?: {
        full_name: string;
    };
}

export interface LoginHistory {
    id: string;
    user_id: string;
    staff_id?: string;
    login_at: string;
    logout_at?: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: 'desktop' | 'mobile' | 'tablet';
    location_id?: string;
    success: boolean;
    failure_reason?: string;
}

export interface StaffPerformance {
    id: string;
    staff_id: string;
    period_start: string;
    period_end: string;
    orders_handled: number;
    total_sales: number;
    average_order_time?: number;
    customer_ratings_count: number;
    customer_ratings_sum: number;
    tips_received: number;
    attendance_percentage?: number;
    late_arrivals: number;
    notes?: string;
    created_at: string;
    // Computed
    average_rating?: number;
    // Joined fields
    staff?: {
        full_name: string;
        role: string;
    };
}

// Permission modules for grouping
export const PERMISSION_MODULES = [
    'dashboard',
    'pos',
    'kitchen',
    'menu',
    'tables',
    'orders',
    'customers',
    'reservations',
    'reports',
    'settings',
    'staff',
    'inventory'
] as const;

export type PermissionModule = typeof PERMISSION_MODULES[number];

// Helper to group permissions by module
export function groupPermissionsByModule(permissions: Permission[]): Record<PermissionModule, Permission[]> {
    const grouped: Record<string, Permission[]> = {};

    for (const module of PERMISSION_MODULES) {
        grouped[module] = permissions.filter(p => p.module === module);
    }

    return grouped as Record<PermissionModule, Permission[]>;
}

// Calculate hours worked from time entry
export function calculateHoursWorked(entry: TimeEntry): number {
    if (!entry.clock_out) return 0;

    const start = new Date(entry.clock_in);
    const end = new Date(entry.clock_out);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - entry.total_break_minutes;

    return Math.max(0, workMinutes / 60);
}

// Format duration in hours and minutes
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}
