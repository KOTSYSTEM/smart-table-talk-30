import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Order = Tables<'orders'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderUpdate = TablesUpdate<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type OrderItemInsert = TablesInsert<'order_items'>;
export type OrderItemUpdate = TablesUpdate<'order_items'>;

export interface OrderWithRelations extends Order {
  table: Tables<'restaurant_tables'> | null;
  customer: Tables<'customers'> | null;
  waiter: Tables<'profiles'> | null;
  items: (OrderItem & {
    menu_item: Tables<'menu_items'> | null;
    variant: Tables<'menu_item_variants'> | null;
  })[];
}

export function useOrders(status?: Order['status']) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          table:restaurant_tables(*),
          customer:customers(*),
          waiter:profiles(*),
          items:order_items(
            *,
            menu_item:menu_items(*),
            variant:menu_item_variants(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OrderWithRelations[];
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:restaurant_tables(*),
          customer:customers(*),
          waiter:profiles(*),
          items:order_items(
            *,
            menu_item:menu_items(*),
            variant:menu_item_variants(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as OrderWithRelations;
    },
    enabled: !!id,
  });
}

export function useTodayOrders() {
  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const channel = supabase
      .channel('today_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', 'today'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:restaurant_tables(*),
          items:order_items(*)
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items
    }: {
      order: OrderInsert & { organization_id?: string };
      items: Omit<OrderItemInsert, 'order_id'>[]
    }) => {
      // Get organization_id from existing data or use default
      let orgId = order.organization_id;

      if (!orgId) {
        // Try to get from existing organization
        // @ts-ignore - organizations table exists after migration
        const { data: orgData } = await supabase.from('organizations').select('id').limit(1).single();

        orgId = (orgData as { id?: string })?.id;
      }

      // Create order with organization_id
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...order,
          organization_id: orgId,
        } as unknown as OrderInsert)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderItem['status'] }) => {
      const { data, error } = await supabase
        .from('order_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
