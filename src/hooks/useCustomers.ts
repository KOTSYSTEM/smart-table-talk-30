import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Customer = Tables<'customers'>;
export type CustomerInsert = TablesInsert<'customers'>;
export type CustomerUpdate = TablesUpdate<'customers'>;

export function useCustomers(searchQuery?: string) {
  return useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('name');

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

export function useCustomerByPhone(phone: string) {
  return useQuery({
    queryKey: ['customers', 'phone', phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!phone && phone.length >= 10,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomerVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, amount_spent }: { id: string; amount_spent: number }) => {
      // First get current customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('visits, total_spent, loyalty_points')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const newTotalSpent = Number(customer.total_spent) + amount_spent;
      const newVisits = customer.visits + 1;
      const newPoints = customer.loyalty_points + Math.floor(amount_spent / 10); // 1 point per ₹10

      // Determine new tier based on total spent
      let newTier: Customer['tier'] = 'bronze';
      if (newTotalSpent >= 50000) newTier = 'platinum';
      else if (newTotalSpent >= 20000) newTier = 'gold';
      else if (newTotalSpent >= 5000) newTier = 'silver';

      const { data, error } = await supabase
        .from('customers')
        .update({
          visits: newVisits,
          total_spent: newTotalSpent,
          loyalty_points: newPoints,
          tier: newTier,
          last_visit: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
