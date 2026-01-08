import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    Calendar,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    IndianRupee,
    ShoppingBag,
    Clock,
    Star
} from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '@/lib/currency';
import {
    LineChart as RechartsLineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Analytics data hooks
function useAnalyticsSummary() {
    return useQuery({
        queryKey: ['analytics-summary'],
        queryFn: async () => {
            // Get today's date components
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

            // Get orders for different periods
            const { data: todayOrders } = await supabase
                .from('orders')
                .select('total, status')
                .gte('created_at', startOfDay);

            const { data: weekOrders } = await supabase
                .from('orders')
                .select('total, status')
                .gte('created_at', startOfWeek);

            const { data: monthOrders } = await supabase
                .from('orders')
                .select('total, status')
                .gte('created_at', startOfMonth);

            // Calculate summaries
            const calculateSummary = (orders: any[]) => {
                const completed = orders?.filter(o => o.status === 'completed') || [];
                return {
                    count: orders?.length || 0,
                    revenue: completed.reduce((sum, o) => sum + Number(o.total), 0),
                    completed: completed.length,
                };
            };

            return {
                today: calculateSummary(todayOrders || []),
                week: calculateSummary(weekOrders || []),
                month: calculateSummary(monthOrders || []),
            };
        },
        staleTime: 60000, // 1 minute
    });
}

function useSalesTrend() {
    return useQuery({
        queryKey: ['sales-trend'],
        queryFn: async () => {
            const days = 7;
            const data = [];

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
                const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

                const { data: orders } = await supabase
                    .from('orders')
                    .select('total')
                    .gte('created_at', startOfDay)
                    .lte('created_at', endOfDay)
                    .eq('status', 'completed');

                data.push({
                    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    revenue: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
                    orders: orders?.length || 0,
                });
            }

            return data;
        },
        staleTime: 300000, // 5 minutes
    });
}

function useTopItems() {
    return useQuery({
        queryKey: ['top-items'],
        queryFn: async () => {
            const { data } = await supabase
                .from('order_items')
                .select(`
          menu_item_id,
          quantity,
          total_price,
          menu_item:menu_items(name, category_id)
        `)
                .limit(100);

            // Aggregate by menu item
            const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

            data?.forEach(item => {
                const id = item.menu_item_id;
                const name = (item.menu_item as any)?.name || 'Unknown';
                const existing = itemMap.get(id) || { name, quantity: 0, revenue: 0 };
                itemMap.set(id, {
                    name,
                    quantity: existing.quantity + item.quantity,
                    revenue: existing.revenue + Number(item.total_price),
                });
            });

            return Array.from(itemMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);
        },
        staleTime: 300000,
    });
}

function useOrdersByType() {
    return useQuery({
        queryKey: ['orders-by-type'],
        queryFn: async () => {
            const { data } = await supabase
                .from('orders')
                .select('type, total')
                .eq('status', 'completed');

            const typeMap = new Map<string, { count: number; revenue: number }>();

            data?.forEach(order => {
                const type = order.type || 'unknown';
                const existing = typeMap.get(type) || { count: 0, revenue: 0 };
                typeMap.set(type, {
                    count: existing.count + 1,
                    revenue: existing.revenue + Number(order.total),
                });
            });

            const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

            return Array.from(typeMap.entries()).map(([type, data], i) => ({
                name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: data.count,
                revenue: data.revenue,
                color: colors[i % colors.length],
            }));
        },
        staleTime: 300000,
    });
}

export default function Analytics() {
    const [refreshing, setRefreshing] = useState(false);
    const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useAnalyticsSummary();
    const { data: salesTrend, isLoading: trendLoading, refetch: refetchTrend } = useSalesTrend();
    const { data: topItems, isLoading: itemsLoading, refetch: refetchItems } = useTopItems();
    const { data: ordersByType, isLoading: typeLoading, refetch: refetchType } = useOrdersByType();

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchSummary(), refetchTrend(), refetchItems(), refetchType()]);
        setRefreshing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Business insights and performance metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summaryLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))
                ) : (
                    <>
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Today's Revenue</p>
                                        <p className="text-3xl font-bold text-emerald-500">
                                            {formatCompactCurrency(summary?.today.revenue || 0)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {summary?.today.completed} orders completed
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/20 rounded-full">
                                        <IndianRupee className="w-6 h-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">This Week</p>
                                        <p className="text-3xl font-bold text-blue-500">
                                            {formatCompactCurrency(summary?.week.revenue || 0)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {summary?.week.count} total orders
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-500/20 rounded-full">
                                        <TrendingUp className="w-6 h-6 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">This Month</p>
                                        <p className="text-3xl font-bold text-amber-500">
                                            {formatCompactCurrency(summary?.month.revenue || 0)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {summary?.month.count} total orders
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-500/20 rounded-full">
                                        <Calendar className="w-6 h-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Revenue Trend (7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trendLoading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={salesTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Orders by Type */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            Orders by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {typeLoading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : (
                            <div className="flex items-center">
                                <ResponsiveContainer width="50%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={ordersByType}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {ordersByType?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-1/2 space-y-3">
                                    {ordersByType?.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-sm">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{item.value}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCompactCurrency(item.revenue)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Items & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5" />
                            Top Selling Items
                        </CardTitle>
                        <CardDescription>Best performers by revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {itemsLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topItems?.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.quantity} sold
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-emerald-500">
                                            {formatCurrency(item.revenue)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Orders Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Order Volume
                        </CardTitle>
                        <CardDescription>Daily order count</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trendLoading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={salesTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
