import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Receipt, 
  CalendarPlus, 
  Truck,
  QrCode,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: PlusCircle, label: 'New Order', path: '/pos', color: 'from-primary to-accent' },
    { icon: Receipt, label: 'Quick Bill', path: '/orders', color: 'from-success to-emerald-600' },
    { icon: CalendarPlus, label: 'Reservation', path: '/reservations', color: 'from-info to-cyan-600' },
    { icon: Truck, label: 'Delivery', path: '/delivery', color: 'from-purple-500 to-violet-600' },
    { icon: QrCode, label: 'QR Order', path: '/pos', color: 'from-pink-500 to-rose-600' },
    { icon: Package, label: 'Inventory', path: '/menu', color: 'from-orange-500 to-amber-600' },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="secondary"
            className="h-auto py-4 flex-col gap-2 hover:scale-105 transition-transform"
            onClick={() => navigate(action.path)}
          >
            <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
