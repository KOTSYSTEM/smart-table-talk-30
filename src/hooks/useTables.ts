import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type RestaurantTable = Tables<'restaurant_tables'>;
export type RestaurantTableInsert = TablesInsert<'restaurant_tables'>;
export type RestaurantTableUpdate = TablesUpdate<'restaurant_tables'>;

export function useTables(section?: string) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('restaurant_tables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['restaurant_tables', section],
    queryFn: async () => {
      let query = supabase
        .from('restaurant_tables')
        .select('*')
        .order('number');

      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as RestaurantTable[];
    },
  });
}

export function useTableSections() {
  return useQuery({
    queryKey: ['table_sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('section');
      
      if (error) throw error;
      
      const sections = [...new Set(data?.map(t => t.section) || [])];
      return sections;
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (table: RestaurantTableInsert) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert(table)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
      queryClient.invalidateQueries({ queryKey: ['table_sections'] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: RestaurantTableUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      guest_count,
      current_order_id 
    }: { 
      id: string; 
      status: RestaurantTable['status'];
      guest_count?: number | null;
      current_order_id?: string | null;
    }) => {
      const updates: RestaurantTableUpdate = { status };
      
      if (status === 'occupied') {
        updates.occupied_since = new Date().toISOString();
        updates.guest_count = guest_count;
        updates.current_order_id = current_order_id;
      } else if (status === 'free') {
        updates.occupied_since = null;
        updates.guest_count = null;
        updates.current_order_id = null;
      }

      const { data, error } = await supabase
        .from('restaurant_tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
      queryClient.invalidateQueries({ queryKey: ['table_sections'] });
    },
  });
}
