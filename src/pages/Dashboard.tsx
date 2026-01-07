import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TableOverview } from '@/components/dashboard/TableOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LiveKOT } from '@/components/dashboard/LiveKOT';
import { mockDashboardStats, mockOrders, mockTables } from '@/data/mockData';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';
import { 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  LayoutGrid,
  Clock,
  ClipboardList
} from 'lucide-react';

export default function Dashboard() {
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
        <StatCard
          title="Today's Revenue"
          value={formatCompactCurrency(mockDashboardStats.todaySales)}
          icon={<IndianRupee className="w-6 h-6" />}
          trend={{ value: 12.5, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="Orders Today"
          value={mockDashboardStats.ordersToday}
          icon={<ShoppingBag className="w-6 h-6" />}
          trend={{ value: 8.2, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(mockDashboardStats.averageOrderValue)}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 3.1, isPositive: true }}
          variant="default"
        />
        <StatCard
          title="Tables Occupied"
          value={`${mockDashboardStats.tablesOccupied}/${mockDashboardStats.totalTables}`}
          icon={<LayoutGrid className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Pending Orders"
          value={mockDashboardStats.pendingOrders}
          icon={<Clock className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="Active KOTs"
          value={mockDashboardStats.activeKOTs}
          icon={<ClipboardList className="w-6 h-6" />}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecentOrders orders={mockOrders} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
          <TableOverview tables={mockTables.slice(0, 8)} />
        </div>
      </div>

      {/* Kitchen Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveKOT />
      </div>
    </div>
  );
}
