import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KOTItem {
  id: string;
  orderNumber: string;
  table: string;
  items: string[];
  time: number; // minutes ago
  status: 'new' | 'in-progress' | 'ready';
  priority: 'normal' | 'rush';
}

const mockKOTs: KOTItem[] = [
  { id: 'k1', orderNumber: 'O-1234', table: 'T1', items: ['Caesar Salad x2', 'Pasta Carbonara'], time: 2, status: 'new', priority: 'normal' },
  { id: 'k2', orderNumber: 'O-1235', table: 'T4', items: ['Grilled Salmon x2', 'Mojito x4'], time: 8, status: 'in-progress', priority: 'rush' },
  { id: 'k3', orderNumber: 'O-1236', table: 'Bar', items: ['Classic Burger', 'Espresso x2'], time: 5, status: 'in-progress', priority: 'normal' },
];

const statusStyles = {
  new: 'border-warning bg-warning/10',
  'in-progress': 'border-info bg-info/10',
  ready: 'border-success bg-success/10',
};

export function LiveKOT() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Live Kitchen</h3>
          <Badge variant="secondary">{mockKOTs.length} Active</Badge>
        </div>
        <Button variant="ghost" size="sm">View KDS</Button>
      </div>

      <div className="p-4 space-y-3">
        {mockKOTs.map((kot) => (
          <div
            key={kot.id}
            className={cn(
              'p-4 rounded-xl border-2 transition-all',
              statusStyles[kot.status]
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">{kot.orderNumber}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{kot.table}</span>
                {kot.priority === 'rush' && (
                  <Badge variant="destructive" className="gap-1">
                    <Flame className="w-3 h-3" /> Rush
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                {kot.time}m
              </div>
            </div>
            <ul className="text-sm space-y-1">
              {kot.items.map((item, i) => (
                <li key={i} className="text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
