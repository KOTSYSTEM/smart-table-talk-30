import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTables, useTableSections, useUpdateTableStatus, type RestaurantTable } from '@/hooks/useTables';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Plus,
  ArrowRightLeft,
  Merge,
  Receipt,
  Sparkles,
  MoreVertical
} from 'lucide-react';

type TableStatus = 'free' | 'occupied' | 'reserved' | 'bill' | 'cleaning';

const statusColors: Record<TableStatus, string> = {
  free: 'bg-table-free',
  occupied: 'bg-table-occupied',
  reserved: 'bg-table-reserved',
  bill: 'bg-table-bill',
  cleaning: 'bg-table-cleaning',
};

const statusBg: Record<TableStatus, string> = {
  free: 'from-table-free/20 to-table-free/5 border-table-free/40',
  occupied: 'from-table-occupied/20 to-table-occupied/5 border-table-occupied/40',
  reserved: 'from-table-reserved/20 to-table-reserved/5 border-table-reserved/40',
  bill: 'from-table-bill/20 to-table-bill/5 border-table-bill/40',
  cleaning: 'from-table-cleaning/20 to-table-cleaning/5 border-table-cleaning/40',
};

const statusLabels: Record<TableStatus, string> = {
  free: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  bill: 'Bill Printed',
  cleaning: 'Cleaning',
};

export default function Tables() {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  const { data: sections } = useTableSections();
  const { data: tables, isLoading } = useTables(selectedSection === 'all' ? undefined : selectedSection);
  const updateTableStatus = useUpdateTableStatus();

  const allSections = ['all', ...(sections || [])];

  const stats = {
    total: tables?.length || 0,
    free: tables?.filter(t => t.status === 'free').length || 0,
    occupied: tables?.filter(t => t.status === 'occupied').length || 0,
    reserved: tables?.filter(t => t.status === 'reserved').length || 0,
  };

  const formatDuration = (date?: string | null) => {
    if (!date) return '-';
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
    try {
      await updateTableStatus.mutateAsync({ id: tableId, status: newStatus });
      toast.success(`Table status updated to ${statusLabels[newStatus]}`);
      if (selectedTable?.id === tableId) {
        setSelectedTable({ ...selectedTable, status: newStatus });
      }
    } catch {
      toast.error('Failed to update table status');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Table Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage floor layout and table assignments
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Table
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Tables</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-table-free/20 to-table-free/5 rounded-xl border border-table-free/40 p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-table-free">{stats.free}</p>
          </div>
          <div className="bg-gradient-to-br from-table-occupied/20 to-table-occupied/5 rounded-xl border border-table-occupied/40 p-4">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-2xl font-bold text-table-occupied">{stats.occupied}</p>
          </div>
          <div className="bg-gradient-to-br from-table-reserved/20 to-table-reserved/5 rounded-xl border border-table-reserved/40 p-4">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="text-2xl font-bold text-table-reserved">{stats.reserved}</p>
          </div>
        </div>

        {/* Section Filter */}
        <div className="flex gap-2 mb-4">
          {allSections.map((section) => (
            <Button
              key={section}
              variant={selectedSection === section ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedSection(section)}
              className="capitalize"
            >
              {section}
            </Button>
          ))}
        </div>

        {/* Floor Plan */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : tables?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No tables found</p>
              <p className="text-sm text-muted-foreground">Add tables to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tables?.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={cn(
                    'relative p-5 rounded-2xl border-2 bg-gradient-to-br transition-all hover:scale-105 text-left',
                    statusBg[table.status as TableStatus],
                    selectedTable?.id === table.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    'absolute top-3 right-3 w-3 h-3 rounded-full',
                    statusColors[table.status as TableStatus],
                    table.status === 'occupied' && 'animate-pulse'
                  )} />

                  {/* Table Number */}
                  <div className="mb-4">
                    <span className="text-3xl font-display font-bold">T{table.number}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {table.section}
                    </Badge>
                  </div>

                  {/* Table Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {table.guest_count || 0} / {table.capacity} seats
                      </span>
                    </div>
                    
                    {table.status === 'occupied' && table.occupied_since && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(table.occupied_since)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Label */}
                  <div className="mt-4">
                    <Badge
                      variant={table.status === 'free' ? 'tableFree' : 
                               table.status === 'occupied' ? 'tableOccupied' :
                               table.status === 'reserved' ? 'tableReserved' :
                               table.status === 'bill' ? 'tableBill' : 'tableCleaning'}
                    >
                      {statusLabels[table.status as TableStatus]}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Detail Panel */}
      {selectedTable && (
        <div className="w-80 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl">Table {selectedTable.number}</h2>
                <p className="text-sm text-muted-foreground">{selectedTable.section}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {/* Status */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-3 h-3 rounded-full', statusColors[selectedTable.status as TableStatus])} />
                <span className="font-medium">{statusLabels[selectedTable.status as TableStatus]}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{selectedTable.capacity} seats</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guests</p>
                  <p className="font-semibold">{selectedTable.guest_count || 0}</p>
                </div>
                {selectedTable.occupied_since && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{formatDuration(selectedTable.occupied_since)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedTable.status === 'free' && (
                  <Button variant="secondary" size="sm" className="justify-start">
                    <Plus className="w-4 h-4 mr-2" /> New Order
                  </Button>
                )}
                {selectedTable.status === 'occupied' && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => handleStatusChange(selectedTable.id, 'bill')}
                    >
                      <Receipt className="w-4 h-4 mr-2" /> Print Bill
                    </Button>
                    <Button variant="secondary" size="sm" className="justify-start">
                      <Plus className="w-4 h-4 mr-2" /> Add Items
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" className="justify-start">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
                </Button>
                <Button variant="secondary" size="sm" className="justify-start">
                  <Merge className="w-4 h-4 mr-2" /> Merge
                </Button>
                {selectedTable.status === 'bill' && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="justify-start col-span-2"
                    onClick={() => handleStatusChange(selectedTable.id, 'cleaning')}
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> Complete Payment
                  </Button>
                )}
                {selectedTable.status !== 'free' && selectedTable.status !== 'reserved' && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="justify-start col-span-2"
                    onClick={() => handleStatusChange(selectedTable.id, 'cleaning')}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Mark for Cleaning
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 border-t border-border">
            {selectedTable.status === 'free' ? (
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Start New Order
              </Button>
            ) : selectedTable.status === 'occupied' ? (
              <Button className="w-full">
                <Receipt className="w-4 h-4 mr-2" /> View Order
              </Button>
            ) : selectedTable.status === 'cleaning' ? (
              <Button 
                className="w-full" 
                variant="success"
                onClick={() => handleStatusChange(selectedTable.id, 'free')}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Mark as Ready
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
