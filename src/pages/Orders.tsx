import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types/restaurant';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Clock, 
  Eye,
  Receipt,
  Printer,
  ChevronRight
} from 'lucide-react';

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  preparing: { label: 'Preparing', variant: 'warning' },
  ready: { label: 'Ready', variant: 'success' },
  served: { label: 'Served', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const orderTypeIcons: Record<string, string> = {
  'dine-in': '🍽️',
  'takeaway': '🥡',
  'delivery': '🚚',
  'online': '💻',
};

export default function Orders() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = mockOrders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const statusFilters: (OrderStatus | 'all')[] = ['all', 'pending', 'preparing', 'ready', 'served', 'completed'];

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Orders List */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all orders across channels
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
            <Button>
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className="capitalize whitespace-nowrap"
            >
              {status === 'all' ? 'All Orders' : statusConfig[status].label}
              {status !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {mockOrders.filter(o => o.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={cn(
                'bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50',
                selectedOrder?.id === order.id && 'border-primary ring-1 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{orderTypeIcons[order.type]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{order.id.slice(-4).toUpperCase()}</span>
                      <Badge variant={statusConfig[order.status].variant}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {order.type} {order.tableId && `• Table ${order.tableId.slice(-1)}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">{formatCurrency(order.total)}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(order.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {order.items.length} items • {order.items.map(i => i.menuItem.name).slice(0, 2).join(', ')}
                  {order.items.length > 2 && ` +${order.items.length - 2} more`}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Detail Panel */}
      {selectedOrder && (
        <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{orderTypeIcons[selectedOrder.type]}</span>
                <div>
                  <h2 className="font-display font-bold text-xl">
                    Order #{selectedOrder.id.slice(-4).toUpperCase()}
                  </h2>
                  <p className="text-sm text-muted-foreground capitalize">{selectedOrder.type}</p>
                </div>
              </div>
              <Badge variant={statusConfig[selectedOrder.status].variant} className="text-sm">
                {statusConfig[selectedOrder.status].label}
              </Badge>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Order Items</h3>
            <div className="space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.price)}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (5%)</span>
                <span>{formatCurrency(selectedOrder.tax)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary">
                <Eye className="w-4 h-4 mr-2" /> View KOT
              </Button>
              <Button variant="secondary">
                <Receipt className="w-4 h-4 mr-2" /> Print Bill
              </Button>
            </div>
            
            {selectedOrder.status === 'ready' && (
              <Button className="w-full">Mark as Served</Button>
            )}
            {selectedOrder.status === 'served' && (
              <Button className="w-full" variant="success">Complete Order</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
