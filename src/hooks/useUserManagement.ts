import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
    StaffSchedule,
    TimeEntry,
    AuditLog,
    StaffPerformance,
    Permission,
    RoleTemplate
} from '@/types/user-management';

// ============ PERMISSIONS ============

export function usePermissions() {
    return useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            // @ts-ignore - Table will exist after migration
            const { data, error } = await supabase
                .from('permissions')
                .select('*')
                .order('module', { ascending: true });

            if (error) throw error;
            return data as unknown as Permission[];
        },
    });
}

// ============ ROLE TEMPLATES ============

export function useRoleTemplates() {
    const { organization } = useOrganization();

    return useQuery({
        queryKey: ['role-templates', organization?.id],
        queryFn: async () => {
            // @ts-ignore - Table will exist after migration
            const { data, error } = await supabase
                .from('role_templates')
                .select('*')
                .or(`organization_id.is.null,organization_id.eq.${organization?.id}`)
                .order('is_system', { ascending: false });

            if (error) throw error;
            return data as unknown as RoleTemplate[];
        },
        enabled: !!organization?.id,
    });
}

// ============ STAFF SCHEDULES ============

export function useStaffSchedules(dateRange?: { start: string; end: string }) {
    const { organization } = useOrganization();

    return useQuery({
        queryKey: ['staff-schedules', organization?.id, dateRange],
        queryFn: async () => {
            // @ts-ignore - Table will exist after migration
            let query = supabase
                .from('staff_schedules')
                .select(`
          *,
          staff:staff_id(full_name, role),
          location:location_id(name)
        `)
                .order('schedule_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (dateRange) {
                query = query
                    .gte('schedule_date', dateRange.start)
                    .lte('schedule_date', dateRange.end);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as unknown as StaffSchedule[];
        },
        enabled: !!organization?.id,
    });
}

export function useCreateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schedule: Partial<StaffSchedule>) => {
            // @ts-ignore - Table will exist after migration
            const { data, error } = await supabase
                .from('staff_schedules')
                .insert(schedule)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
        },
    });
}

export function useUpdateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffSchedule> }) => {
            // @ts-ignore - Table will exist after migration
            const { data, error } = await supabase
                .from('staff_schedules')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
        },
    });
}

// ============ TIME ENTRIES ============

export function useTimeEntries(staffId?: string, dateRange?: { start: string; end: string }) {
    const { organization } = useOrganization();

    return useQuery({
        queryKey: ['time-entries', organization?.id, staffId, dateRange],
        queryFn: async () => {
            // @ts-ignore - Table will exist after migration
            let query = supabase
                .from('time_entries')
                .select(`
          *,
          staff:staff_id(full_name, role)
        `)
                .order('clock_in', { ascending: false });

            if (staffId) {
                query = query.eq('staff_id', staffId);
            }

            if (dateRange) {
                query = query
                    .gte('clock_in', dateRange.start)
                    .lte('clock_in', dateRange.end);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as unknown as TimeEntry[];
        },
        enabled: !!organization?.id,
    });
}

export function useCurrentTimeEntry() {
    const { staff } = useOrganization();

    return useQuery({
        queryKey: ['current-time-entry', staff?.id],
        queryFn: async () => {
            if (!staff?.id) return null;

            // @ts-ignore - Table will exist after migration
            const { data, error } = await supabase
                .from('time_entries')
                .select('*')
                .eq('staff_id', staff.id)
                .is('clock_out', null)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data as unknown as TimeEntry | null;
        },
        enabled: !!staff?.id,
    });
}

export function useClockIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (locationId?: string) => {
            // @ts-ignore - Function will exist after migration
            const { data, error } = await supabase.rpc('clock_in', {
                p_location_id: locationId || null,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-entries'] });
            queryClient.invalidateQueries({ queryKey: ['current-time-entry'] });
        },
    });
}

export function useClockOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // @ts-ignore - Function will exist after migration
            const { data, error } = await supabase.rpc('clock_out');

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-entries'] });
            queryClient.invalidateQueries({ queryKey: ['current-time-entry'] });
        },
    });
}

// ============ AUDIT LOGS ============

export function useAuditLogs(filters?: {
    entityType?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}) {
    const { organization } = useOrganization();

    return useQuery({
        queryKey: ['audit-logs', organization?.id, filters],
        queryFn: async () => {
            // @ts-ignore - Table will exist after migration
            let query = supabase
                .from('audit_logs')
                .select(`
          *,
          staff:staff_id(full_name)
        `)
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false })
                .limit(filters?.limit || 100);

            if (filters?.entityType) {
                query = query.eq('entity_type', filters.entityType);
            }
            if (filters?.userId) {
                query = query.eq('user_id', filters.userId);
            }
            if (filters?.action) {
                query = query.eq('action', filters.action);
            }
            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as unknown as AuditLog[];
        },
        enabled: !!organization?.id,
    });
}

// ============ STAFF PERFORMANCE ============

export function useStaffPerformance(staffId?: string, period?: { start: string; end: string }) {
    const { organization } = useOrganization();

    return useQuery({
        queryKey: ['staff-performance', organization?.id, staffId, period],
        queryFn: async () => {
            // @ts-ignore - Table will exist after migration
            let query = supabase
                .from('staff_performance')
                .select(`
          *,
          staff:staff_id(full_name, role)
        `)
                .order('period_start', { ascending: false });

            if (staffId) {
                query = query.eq('staff_id', staffId);
            }

            if (period) {
                query = query
                    .gte('period_start', period.start)
                    .lte('period_end', period.end);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Calculate average rating
            return (data as unknown as StaffPerformance[]).map(p => ({
                ...p,
                average_rating: p.customer_ratings_count > 0
                    ? p.customer_ratings_sum / p.customer_ratings_count
                    : undefined,
            }));
        },
        enabled: !!organization?.id,
    });
}
