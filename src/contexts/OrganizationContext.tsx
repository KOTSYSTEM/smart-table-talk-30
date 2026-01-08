import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Organization, Location, Staff, StaffRole, Permission, hasPermission } from '@/types/organization';

interface OrganizationContextType {
    // Current state
    organization: Organization | null;
    location: Location | null;
    staff: Staff | null;
    locations: Location[];

    // Loading states
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    switchLocation: (locationId: string) => Promise<void>;
    refreshOrganization: () => Promise<void>;

    // Permission helpers
    hasPermission: (permission: Permission) => boolean;
    isRole: (...roles: StaffRole[]) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [location, setLocation] = useState<Location | null>(null);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch organization data when user is authenticated
    useEffect(() => {
        const fetchOrganizationData = async () => {
            try {
                setIsLoading(true);

                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsInitialized(true);
                    setIsLoading(false);
                    return;
                }

                // Get staff record for current user
                // @ts-ignore - Table will exist after migration
                const { data: staffData, error: staffError } = await supabase
                    .from('staff')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .single();

                if (staffError || !staffData) {
                    console.log('No staff record found for user');
                    setIsInitialized(true);
                    setIsLoading(false);
                    return;
                }

                setStaff(staffData as unknown as Staff);

                // Get organization
                // @ts-ignore - Table will exist after migration
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', staffData.organization_id)
                    .single();

                if (orgError) throw orgError;
                setOrganization(orgData as unknown as Organization);

                // Get all locations for this organization
                // @ts-ignore - Table will exist after migration
                const { data: locationsData, error: locError } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('organization_id', staffData.organization_id)
                    .eq('is_active', true)
                    .order('is_primary', { ascending: false });

                if (locError) throw locError;
                setLocations((locationsData || []) as unknown as Location[]);

                // Set current location (staff's assigned location or primary)
                if (staffData.location_id && locationsData) {
                    const staffLocation = locationsData.find((l: any) => l.id === staffData.location_id);
                    setLocation((staffLocation || locationsData[0]) as unknown as Location);
                } else if (locationsData) {
                    const primaryLocation = locationsData.find((l: any) => l.is_primary);
                    setLocation((primaryLocation || locationsData[0]) as unknown as Location);
                }

            } catch (error) {
                console.error('Error fetching organization data:', error);
            } finally {
                setIsLoading(false);
                setIsInitialized(true);
            }
        };

        fetchOrganizationData();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                fetchOrganizationData();
            } else if (event === 'SIGNED_OUT') {
                setOrganization(null);
                setLocation(null);
                setStaff(null);
                setLocations([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const switchLocation = async (locationId: string) => {
        const newLocation = locations.find(l => l.id === locationId);
        if (newLocation) {
            setLocation(newLocation);
            // Optionally persist to local storage
            localStorage.setItem('currentLocationId', locationId);
        }
    };

    const refreshOrganization = async () => {
        if (!organization?.id) return;

        // @ts-ignore - Table will exist after migration
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', organization.id)
            .single();

        if (!error && data) {
            setOrganization(data as unknown as Organization);
        }
    };

    const checkPermission = (permission: Permission): boolean => {
        if (!staff) return false;
        return hasPermission(staff.role, permission, staff.permissions);
    };

    const isRole = (...roles: StaffRole[]): boolean => {
        if (!staff) return false;
        return roles.includes(staff.role);
    };

    const value: OrganizationContextType = {
        organization,
        location,
        staff,
        locations,
        isLoading,
        isInitialized,
        switchLocation,
        refreshOrganization,
        hasPermission: checkPermission,
        isRole,
    };

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}

// Hook for checking permissions
export function usePermission(permission: Permission): boolean {
    const { hasPermission } = useOrganization();
    return hasPermission(permission);
}

// Hook for checking role
export function useRole(...roles: StaffRole[]): boolean {
    const { isRole } = useOrganization();
    return isRole(...roles);
}
