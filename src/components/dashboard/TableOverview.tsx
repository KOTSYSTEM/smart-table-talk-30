import { Table as TableType, TableStatus } from '@/types/restaurant';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface TableOverviewProps {
  tables: TableType[];
}

const statusColors: Record<TableStatus, string> = {
  free: 'bg-table-free',
  occupied: 'bg-table-occupied',
  reserved: 'bg-table-reserved',
  bill: 'bg-table-bill',
  cleaning: 'bg-table-cleaning',
};

const statusBadgeVariants: Record<TableStatus, 'tableFree' | 'tableOccupied' | 'tableReserved' | 'tableBill' | 'tableCleaning'> = {
  free: 'tableFree',
  occupied: 'tableOccupied',
  reserved: 'tableReserved',
  bill: 'tableBill',
  cleaning: 'tableCleaning',
};

export function TableOverview({ tables }: TableOverviewProps) {
  const sections = [...new Set(tables.map(t => t.section))];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Table Overview</h3>
        <Button variant="ghost" size="sm">Manage</Button>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-3">
        {(['free', 'occupied', 'reserved', 'bill', 'cleaning'] as TableStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2 text-xs">
            <div className={cn('w-3 h-3 rounded-full', statusColors[status])} />
            <span className="capitalize text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-6">
        {sections.map((section) => (
          <div key={section}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">{section}</h4>
            <div className="grid grid-cols-4 gap-3">
              {tables
                .filter(t => t.section === section)
                .map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      'relative p-3 rounded-xl border-2 transition-all cursor-pointer hover:scale-105',
                      table.status === 'free' && 'border-table-free/50 bg-table-free/10',
                      table.status === 'occupied' && 'border-table-occupied/50 bg-table-occupied/10',
                      table.status === 'reserved' && 'border-table-reserved/50 bg-table-reserved/10',
                      table.status === 'bill' && 'border-table-bill/50 bg-table-bill/10',
                      table.status === 'cleaning' && 'border-table-cleaning/50 bg-table-cleaning/10'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">T{table.number}</span>
                      <div className={cn('w-2 h-2 rounded-full', statusColors[table.status])} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{table.guestCount || 0}/{table.capacity}</span>
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
