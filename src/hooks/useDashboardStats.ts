import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  todaySales: number;
  ordersToday: number;
  averageOrderValue: number;
  tablesOccupied: number;
  totalTables: number;
  pendingOrders: number;
  activeKOTs: number;
}

export function useDashboardStats() {
  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Set up real-time subscriptions
  useEffect(() => {
    const ordersChannel = supabase
      .channel('dashboard_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        }
      )
      .subscribe();

    const tablesChannel = supabase
      .channel('dashboard_tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        }
      )
      .subscribe();

    const orderItemsChannel = supabase
      .channel('dashboard_order_items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(orderItemsChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString());

      if (ordersError) throw ordersError;

      // Get tables stats
      const { data: tables, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('status');

      if (tablesError) throw tablesError;

      // Get active KOTs (order items that aren't served)
      const { data: activeKOTs, error: kotsError } = await supabase
        .from('order_items')
        .select('id')
        .neq('status', 'served');

      if (kotsError) throw kotsError;

      const completedOrders = todayOrders?.filter(o => 
        o.status === 'completed' || o.status === 'served'
      ) || [];
      
      const todaySales = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const ordersCount = todayOrders?.length || 0;
      const averageOrderValue = ordersCount > 0 ? todaySales / completedOrders.length : 0;
      
      const totalTables = tables?.length || 0;
      const tablesOccupied = tables?.filter(t => t.status === 'occupied').length || 0;
      
      const pendingOrders = todayOrders?.filter(o => 
        o.status === 'pending' || o.status === 'confirmed'
      ).length || 0;

      return {
        todaySales,
        ordersToday: ordersCount,
        averageOrderValue: isNaN(averageOrderValue) ? 0 : averageOrderValue,
        tablesOccupied,
        totalTables,
        pendingOrders,
        activeKOTs: activeKOTs?.length || 0,
      };
    },
  });
}
