import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Phone,
  Navigation,
  CheckCircle,
  User,
  Package,
  MoreVertical
} from 'lucide-react';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: { name: string; quantity: number }[];
  total: number;
  status: 'pending' | 'assigned' | 'picked-up' | 'on-way' | 'delivered';
  rider?: {
    name: string;
    phone: string;
    avatar: string;
  };
  estimatedTime: number;
  createdAt: Date;
}

const mockDeliveries: DeliveryOrder[] = [
  {
    id: 'd1',
    orderNumber: 'D-1234',
    customer: {
      name: 'Alex Thompson',
      phone: '+1 234 567 8900',
      address: '123 Main Street, Apt 4B, Downtown',
    },
    items: [
      { name: 'Margherita Pizza', quantity: 2 },
      { name: 'Garlic Bread', quantity: 1 },
    ],
    total: 42.99,
    status: 'on-way',
    rider: {
      name: 'David Miller',
      phone: '+1 234 567 8950',
      avatar: 'D',
    },
    estimatedTime: 15,
    createdAt: new Date(Date.now() - 25 * 60000),
  },
  {
    id: 'd2',
    orderNumber: 'D-1235',
    customer: {
      name: 'Jessica Lee',
      phone: '+1 234 567 8901',
      address: '456 Oak Avenue, Suite 12',
    },
    items: [
      { name: 'Classic Burger', quantity: 2 },
      { name: 'Fries', quantity: 2 },
      { name: 'Coke', quantity: 2 },
    ],
    total: 38.50,
    status: 'assigned',
    rider: {
      name: 'Mike Johnson',
      phone: '+1 234 567 8951',
      avatar: 'M',
    },
    estimatedTime: 30,
    createdAt: new Date(Date.now() - 10 * 60000),
  },
  {
    id: 'd3',
    orderNumber: 'D-1236',
    customer: {
      name: 'Robert Chen',
      phone: '+1 234 567 8902',
      address: '789 Pine Road, Building C',
    },
    items: [
      { name: 'Grilled Salmon', quantity: 1 },
      { name: 'Caesar Salad', quantity: 1 },
    ],
    total: 45.98,
    status: 'pending',
    estimatedTime: 45,
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: 'd4',
    orderNumber: 'D-1233',
    customer: {
      name: 'Maria Garcia',
      phone: '+1 234 567 8903',
      address: '321 Elm Street, Unit 7',
    },
    items: [
      { name: 'Pepperoni Pizza', quantity: 1 },
    ],
    total: 22.99,
    status: 'delivered',
    rider: {
      name: 'David Miller',
      phone: '+1 234 567 8950',
      avatar: 'D',
    },
    estimatedTime: 0,
    createdAt: new Date(Date.now() - 60 * 60000),
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive'; color: string }> = {
  pending: { label: 'Pending', variant: 'warning', color: 'border-warning bg-warning/10' },
  assigned: { label: 'Assigned', variant: 'info', color: 'border-info bg-info/10' },
  'picked-up': { label: 'Picked Up', variant: 'info', color: 'border-info bg-info/10' },
  'on-way': { label: 'On the Way', variant: 'warning', color: 'border-primary bg-primary/10' },
  delivered: { label: 'Delivered', variant: 'success', color: 'border-success bg-success/10' },
};

export default function Delivery() {
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = mockDeliveries.filter(order =>
    statusFilter === 'all' || order.status === statusFilter
  );

  const activeOrders = mockDeliveries.filter(o => o.status !== 'delivered').length;

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Delivery Management</h1>
              <p className="text-muted-foreground">Track and manage delivery orders</p>
            </div>
          </div>
          <Badge variant="warning" className="text-base px-4 py-2">
            {activeOrders} Active Deliveries
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Today's Deliveries</p>
            <p className="text-2xl font-bold">24</p>
          </div>
          <div className="bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl border border-warning/40 p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">
              {mockDeliveries.filter(o => o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/40 p-4">
            <p className="text-sm text-muted-foreground">On the Way</p>
            <p className="text-2xl font-bold text-primary">
              {mockDeliveries.filter(o => o.status === 'on-way').length}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
            <p className="text-2xl font-bold">28m</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'assigned', 'on-way', 'delivered'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Orders' : status === 'on-way' ? 'On the Way' : status}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={cn(
                'bg-card border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg',
                statusConfig[order.status].color,
                selectedOrder?.id === order.id && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{order.orderNumber}</span>
                      <Badge variant={statusConfig[order.status].variant}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                  {order.estimatedTime > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      ~{order.estimatedTime}m
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{order.customer.address}</span>
              </div>

              {order.rider && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                    {order.rider.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{order.rider.name}</p>
                    <p className="text-xs text-muted-foreground">Delivery Partner</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Detail Panel */}
      {selectedOrder && (
        <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl">{selectedOrder.orderNumber}</h2>
                <Badge variant={statusConfig[selectedOrder.status].variant}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Customer Info */}
            <div className="p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Customer</span>
              </div>
              <p className="font-semibold">{selectedOrder.customer.name}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.customer.phone}</p>
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">{selectedOrder.customer.address}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-3">Order Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold mt-3 pt-3 border-t border-border">
                <span>Total</span>
                <span className="text-primary">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Rider Info */}
            {selectedOrder.rider && (
              <div className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Delivery Partner</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                    {selectedOrder.rider.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedOrder.rider.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.rider.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ETA */}
            {selectedOrder.estimatedTime > 0 && (
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <p className="text-2xl font-bold">{selectedOrder.estimatedTime} minutes</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            {selectedOrder.status === 'pending' && (
              <Button className="w-full">
                <User className="w-4 h-4 mr-2" /> Assign Rider
              </Button>
            )}
            {selectedOrder.status === 'assigned' && (
              <Button className="w-full">
                <Package className="w-4 h-4 mr-2" /> Mark as Picked Up
              </Button>
            )}
            {selectedOrder.status === 'on-way' && (
              <>
                <Button variant="secondary" className="w-full">
                  <Navigation className="w-4 h-4 mr-2" /> Track Location
                </Button>
                <Button className="w-full" variant="success">
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Delivered
                </Button>
              </>
            )}
            {selectedOrder.status === 'delivered' && (
              <div className="text-center text-success py-4">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Order Delivered Successfully</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
