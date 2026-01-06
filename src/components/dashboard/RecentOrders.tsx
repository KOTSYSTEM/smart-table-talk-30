import { Order } from '@/types/restaurant';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentOrdersProps {
  orders: Order[];
}

const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'warning',
  ready: 'success',
  served: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
};

const orderTypeIcons: Record<string, string> = {
  'dine-in': '🍽️',
  'takeaway': '🥡',
  'delivery': '🚚',
  'online': '💻',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Recent Orders</h3>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      <div className="divide-y divide-border">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{orderTypeIcons[order.type]}</span>
                <div>
                  <span className="font-semibold">#{order.id.slice(-4).toUpperCase()}</span>
                  {order.tableId && (
                    <span className="text-muted-foreground ml-2">
                      Table {order.tableId.slice(-1)}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={statusVariants[order.status]}>
                {order.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {order.items.length} items
              </span>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">
                  ${order.total.toFixed(2)}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(order.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
