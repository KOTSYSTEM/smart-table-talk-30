import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Reservation = Tables<'reservations'>;
export type ReservationInsert = TablesInsert<'reservations'>;
export type ReservationUpdate = TablesUpdate<'reservations'>;

export interface ReservationWithRelations extends Reservation {
  customer: Tables<'customers'> | null;
  table: Tables<'restaurant_tables'> | null;
}

export function useReservations(date?: string) {
  return useQuery({
    queryKey: ['reservations', date],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          customer:customers(*),
          table:restaurant_tables(*)
        `)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (date) {
        query = query.eq('reservation_date', date);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ReservationWithRelations[];
    },
  });
}

export function useTodayReservations() {
  const today = new Date().toISOString().split('T')[0];
  return useReservations(today);
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reservation: ReservationInsert) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ReservationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Reservation['status'] }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
