import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TableOverview } from '@/components/dashboard/TableOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LiveKOT } from '@/components/dashboard/LiveKOT';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTodayOrders } from '@/hooks/useOrders';
import { useTables } from '@/hooks/useTables';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  LayoutGrid,
  Clock,
  ClipboardList
} from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayOrders } = useTodayOrders();
  const { data: tables } = useTables();

  // Transform orders for RecentOrders component
  const recentOrders = todayOrders?.slice(0, 5).map(order => ({
    id: order.id,
    type: order.type.replace('_', '-') as 'dine-in' | 'takeaway' | 'delivery' | 'online',
    status: order.status as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled',
    tableId: order.table?.id,
    items: order.items?.map(item => ({
      id: item.id,
      menuItem: {
        id: item.menu_item_id || '',
        name: 'Menu Item',
        description: '',
        price: Number(item.unit_price),
        category: '',
        isAvailable: true,
        preparationTime: 15,
      },
      quantity: item.quantity,
      status: item.status as 'new' | 'in-progress' | 'ready' | 'served',
      price: Number(item.total_price),
    })) || [],
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
  })) || [];

  // Transform tables for TableOverview component
  const overviewTables = tables?.slice(0, 8).map(table => ({
    id: table.id,
    number: table.number,
    section: table.section,
    capacity: table.capacity,
    status: table.status as 'free' | 'occupied' | 'reserved' | 'bill' | 'cleaning',
    guestCount: table.guest_count || undefined,
    occupiedSince: table.occupied_since ? new Date(table.occupied_since) : undefined,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening at your restaurant today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Today's Revenue"
              value={formatCompactCurrency(stats?.todaySales || 0)}
              icon={<IndianRupee className="w-6 h-6" />}
              trend={{ value: 12.5, isPositive: true }}
              variant="primary"
            />
            <StatCard
              title="Orders Today"
              value={stats?.ordersToday || 0}
              icon={<ShoppingBag className="w-6 h-6" />}
              trend={{ value: 8.2, isPositive: true }}
              variant="success"
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(stats?.averageOrderValue || 0)}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={{ value: 3.1, isPositive: true }}
              variant="default"
            />
            <StatCard
              title="Tables Occupied"
              value={`${stats?.tablesOccupied || 0}/${stats?.totalTables || 0}`}
              icon={<LayoutGrid className="w-6 h-6" />}
              variant="warning"
            />
          </>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Pending Orders"
              value={stats?.pendingOrders || 0}
              icon={<Clock className="w-6 h-6" />}
              variant="default"
            />
            <StatCard
              title="Active KOTs"
              value={stats?.activeKOTs || 0}
              icon={<ClipboardList className="w-6 h-6" />}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecentOrders orders={recentOrders} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
          <TableOverview tables={overviewTables} />
        </div>
      </div>

      {/* Kitchen Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveKOT />
      </div>
    </div>
  );
}
