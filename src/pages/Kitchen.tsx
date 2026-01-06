import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  items: {
    name: string;
    quantity: number;
    modifications?: string;
    status: 'pending' | 'cooking' | 'ready';
  }[];
  createdAt: Date;
  priority: 'normal' | 'rush';
  status: 'new' | 'in-progress' | 'ready';
}

const mockKOTs: KOTTicket[] = [
  {
    id: 'kot1',
    orderNumber: 'O-1234',
    table: 'T1',
    orderType: 'dine-in',
    items: [
      { name: 'Caesar Salad', quantity: 2, status: 'cooking' },
      { name: 'Pasta Carbonara', quantity: 1, modifications: 'Extra cheese', status: 'pending' },
    ],
    createdAt: new Date(Date.now() - 8 * 60000),
    priority: 'normal',
    status: 'in-progress',
  },
  {
    id: 'kot2',
    orderNumber: 'O-1235',
    table: 'T4',
    orderType: 'dine-in',
    items: [
      { name: 'Grilled Salmon', quantity: 2, status: 'pending' },
      { name: 'Bruschetta', quantity: 1, status: 'ready' },
    ],
    createdAt: new Date(Date.now() - 12 * 60000),
    priority: 'rush',
    status: 'in-progress',
  },
  {
    id: 'kot3',
    orderNumber: 'O-1236',
    table: 'Takeaway',
    orderType: 'takeaway',
    items: [
      { name: 'Classic Burger', quantity: 2, status: 'pending' },
      { name: 'BBQ Chicken Wings', quantity: 1, status: 'pending' },
    ],
    createdAt: new Date(Date.now() - 3 * 60000),
    priority: 'normal',
    status: 'new',
  },
  {
    id: 'kot4',
    orderNumber: 'O-1237',
    table: 'Delivery',
    orderType: 'delivery',
    items: [
      { name: 'Margherita Pizza', quantity: 1, modifications: 'No basil', status: 'ready' },
      { name: 'Pepperoni Pizza', quantity: 1, status: 'ready' },
    ],
    createdAt: new Date(Date.now() - 15 * 60000),
    priority: 'rush',
    status: 'ready',
  },
];

const statusColumns = [
  { id: 'new', label: 'New Orders', color: 'from-warning/20 to-warning/5 border-warning/40' },
  { id: 'in-progress', label: 'In Progress', color: 'from-info/20 to-info/5 border-info/40' },
  { id: 'ready', label: 'Ready to Serve', color: 'from-success/20 to-success/5 border-success/40' },
];

export default function Kitchen() {
  const [tickets, setTickets] = useState(mockKOTs);

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

  const updateTicketStatus = (ticketId: string, newStatus: 'new' | 'in-progress' | 'ready') => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: newStatus } : t
    ));
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
              {tickets
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
                      <span className="text-muted-foreground ml-2 capitalize">• {ticket.orderType}</span>
                    </div>

                    {/* Items */}
                    <div className="p-3 space-y-2">
                      {ticket.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
                            item.status === 'ready' && 'bg-success text-success-foreground',
                            item.status === 'cooking' && 'bg-warning text-warning-foreground',
                            item.status === 'pending' && 'bg-secondary'
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
                            {item.modifications && (
                              <p className="text-xs text-warning">⚠️ {item.modifications}</p>
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
                          onClick={() => updateTicketStatus(ticket.id, 'in-progress')}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {column.id === 'in-progress' && (
                        <Button 
                          className="w-full" 
                          size="sm" 
                          variant="success"
                          onClick={() => updateTicketStatus(ticket.id, 'ready')}
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
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
