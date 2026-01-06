import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Reports() {
  const topItems = [
    { name: 'Margherita Pizza', sales: 156, revenue: 2651.44, change: 12.5 },
    { name: 'Classic Burger', sales: 134, revenue: 2542.66, change: 8.3 },
    { name: 'Grilled Salmon', sales: 98, revenue: 2841.02, change: -3.2 },
    { name: 'Caesar Salad', sales: 87, revenue: 1129.13, change: 15.7 },
    { name: 'Pasta Carbonara', sales: 76, revenue: 1367.24, change: 5.1 },
  ];

  const hourlyData = [
    { hour: '11AM', orders: 12, revenue: 456 },
    { hour: '12PM', orders: 28, revenue: 1245 },
    { hour: '1PM', orders: 35, revenue: 1567 },
    { hour: '2PM', orders: 22, revenue: 987 },
    { hour: '3PM', orders: 15, revenue: 678 },
    { hour: '6PM', orders: 32, revenue: 1456 },
    { hour: '7PM', orders: 45, revenue: 2134 },
    { hour: '8PM', orders: 52, revenue: 2567 },
    { hour: '9PM', orders: 38, revenue: 1789 },
    { hour: '10PM', orders: 18, revenue: 876 },
  ];

  const maxOrders = Math.max(...hourlyData.map(d => d.orders));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and insights for your restaurant
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Calendar className="w-4 h-4 mr-2" /> Today
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
            <Badge variant="success" className="gap-1">
              <ArrowUpRight className="w-3 h-3" /> 12.5%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-display font-bold mt-1">$12,847</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            <Badge variant="success" className="gap-1">
              <ArrowUpRight className="w-3 h-3" /> 8.3%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-3xl font-display font-bold mt-1">189</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
            <Badge variant="success" className="gap-1">
              <ArrowUpRight className="w-3 h-3" /> 15.2%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Customers Served</p>
          <p className="text-3xl font-display font-bold mt-1">342</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
            <Badge variant="destructive" className="gap-1">
              <ArrowDownRight className="w-3 h-3" /> 2.1%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Avg. Order Time</p>
          <p className="text-3xl font-display font-bold mt-1">18m</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders Chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg">Orders by Hour</h3>
            <Badge variant="secondary">Today</Badge>
          </div>
          <div className="h-64 flex items-end gap-2">
            {hourlyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all hover:from-primary/90"
                  style={{ height: `${(data.orders / maxOrders) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{data.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Types */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg">Order Distribution</h3>
            <Badge variant="secondary">Today</Badge>
          </div>
          <div className="space-y-4">
            {[
              { type: 'Dine-in', icon: '🍽️', count: 98, percent: 52, color: 'bg-primary' },
              { type: 'Takeaway', icon: '🥡', count: 45, percent: 24, color: 'bg-success' },
              { type: 'Delivery', icon: '🚚', count: 32, percent: 17, color: 'bg-info' },
              { type: 'Online', icon: '💻', count: 14, percent: 7, color: 'bg-warning' },
            ].map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count} orders</span>
                    <Badge variant="secondary">{item.percent}%</Badge>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Top Selling Items</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Units Sold</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Revenue</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Change</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="text-right p-4">{item.sales}</td>
                  <td className="text-right p-4 font-semibold">${item.revenue.toFixed(2)}</td>
                  <td className="text-right p-4">
                    <Badge variant={item.change > 0 ? 'success' : 'destructive'} className="gap-1">
                      {item.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(item.change)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
