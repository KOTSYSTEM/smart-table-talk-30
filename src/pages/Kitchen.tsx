import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders, useUpdateOrderItemStatus, type OrderWithRelations } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Clock, 
  ChefHat, 
  Flame,
  CheckCircle,
  Bell,
  Volume2,
  Settings
} from 'lucide-react';

interface KOTTicket {
  id: string;
  orderNumber: string;
  table: string;
  orderType: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes?: string | null;
    status: string;
  }[];
  createdAt: Date;
  priority: 'normal' | 'rush';
  status: 'new' | 'in_progress' | 'ready';
}

const statusColumns = [
  { id: 'new', label: 'New Orders', color: 'from-warning/20 to-warning/5 border-warning/40' },
  { id: 'in_progress', label: 'In Progress', color: 'from-info/20 to-info/5 border-info/40' },
  { id: 'ready', label: 'Ready to Serve', color: 'from-success/20 to-success/5 border-success/40' },
];

function transformOrdersToKOTs(orders: OrderWithRelations[]): KOTTicket[] {
  return orders
    .filter(order => order.status !== 'completed' && order.status !== 'cancelled' && order.items.length > 0)
    .map(order => {
      // Determine ticket status based on item statuses
      const itemStatuses = order.items.map(item => item.status);
      let ticketStatus: 'new' | 'in_progress' | 'ready' = 'new';
      
      if (itemStatuses.every(s => s === 'ready' || s === 'served')) {
        ticketStatus = 'ready';
      } else if (itemStatuses.some(s => s === 'in_progress' || s === 'ready')) {
        ticketStatus = 'in_progress';
      }

      // Determine priority based on time
      const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
      const priority = minutes > 15 ? 'rush' : 'normal';

      return {
        id: order.id,
        orderNumber: `O-${order.order_number || order.id.slice(-4).toUpperCase()}`,
        table: order.table ? `T${order.table.number}` : order.type === 'delivery' ? 'Delivery' : 'Takeaway',
        orderType: order.type,
        items: order.items.map(item => ({
          id: item.id,
          name: item.menu_item?.name || 'Unknown Item',
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
        })),
        createdAt: new Date(order.created_at),
        priority,
        status: ticketStatus,
      };
    });
}

export default function Kitchen() {
  const { data: orders, isLoading } = useOrders();
  const updateItemStatus = useUpdateOrderItemStatus();
  const [tickets, setTickets] = useState<KOTTicket[]>([]);

  useEffect(() => {
    if (orders) {
      setTickets(transformOrdersToKOTs(orders));
    }
  }, [orders]);

  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    return `${minutes}m`;
  };

  const getTimeColor = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes > 15) return 'text-destructive';
    if (minutes > 10) return 'text-warning';
    return 'text-muted-foreground';
  };

  const updateTicketStatus = async (ticketId: string, newStatus: 'new' | 'in_progress' | 'ready') => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    try {
      // Update all items in the ticket to the corresponding status
      const itemStatus = newStatus === 'ready' ? 'ready' : newStatus === 'in_progress' ? 'in_progress' : 'new';
      
      for (const item of ticket.items) {
        await updateItemStatus.mutateAsync({ id: item.id, status: itemStatus });
      }

      toast.success(`Order moved to ${statusColumns.find(c => c.id === newStatus)?.label}`);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Kitchen Display</h1>
            <p className="text-muted-foreground">Real-time order management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Volume2 className="w-4 h-4 mr-2" /> Sound On
          </Button>
          <Button variant="secondary">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
        </div>
      </div>

      {/* KDS Board */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex flex-col rounded-2xl border-2 bg-gradient-to-b overflow-hidden',
              column.color
            )}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">{column.label}</h2>
              <Badge variant="secondary">
                {tickets.filter(t => t.status === column.id).length}
              </Badge>
            </div>

            {/* Tickets */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))
              ) : (
                tickets
                  .filter(t => t.status === column.id)
                  .sort((a, b) => {
                    if (a.priority === 'rush' && b.priority !== 'rush') return -1;
                    if (b.priority === 'rush' && a.priority !== 'rush') return 1;
                    return a.createdAt.getTime() - b.createdAt.getTime();
                  })
                  .map((ticket) => (
                    <div
                      key={ticket.id}
                      className={cn(
                        'bg-card rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg',
                        ticket.priority === 'rush' && 'border-destructive animate-pulse-glow'
                      )}
                    >
                      {/* Ticket Header */}
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{ticket.orderNumber}</span>
                          {ticket.priority === 'rush' && (
                            <Badge variant="destructive" className="gap-1">
                              <Flame className="w-3 h-3" /> Rush
                            </Badge>
                          )}
                        </div>
                        <div className={cn('flex items-center gap-1 font-mono text-sm', getTimeColor(ticket.createdAt))}>
                          <Clock className="w-4 h-4" />
                          {formatTime(ticket.createdAt)}
                        </div>
                      </div>

                      {/* Ticket Info */}
                      <div className="px-3 py-2 bg-secondary/30 text-sm">
                        <span className="font-medium">{ticket.table}</span>
                        <span className="text-muted-foreground ml-2 capitalize">• {ticket.orderType.replace('_', '-')}</span>
                      </div>

                      {/* Items */}
                      <div className="p-3 space-y-2">
                        {ticket.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <div className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
                              item.status === 'ready' && 'bg-success text-success-foreground',
                              item.status === 'in_progress' && 'bg-warning text-warning-foreground',
                              (item.status === 'new' || !item.status) && 'bg-secondary'
                            )}>
                              {item.status === 'ready' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <span className="text-xs font-bold">{item.quantity}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={cn(
                                'font-medium',
                                item.status === 'ready' && 'line-through text-muted-foreground'
                              )}>
                                {item.name}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-warning">⚠️ {item.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="p-3 border-t border-border">
                        {column.id === 'new' && (
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                            disabled={updateItemStatus.isPending}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {column.id === 'in_progress' && (
                          <Button 
                            className="w-full" 
                            size="sm" 
                            variant="success"
                            onClick={() => updateTicketStatus(ticket.id, 'ready')}
                            disabled={updateItemStatus.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Ready
                          </Button>
                        )}
                        {column.id === 'ready' && (
                          <Button 
                            className="w-full" 
                            size="sm" 
                            variant="secondary"
                          >
                            <Bell className="w-4 h-4 mr-2" /> Call Server
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
              )}
              
              {!isLoading && tickets.filter(t => t.status === column.id).length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-muted-foreground text-sm">No orders</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
