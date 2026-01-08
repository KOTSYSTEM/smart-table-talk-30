import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTables, useTableSections, useUpdateTableStatus, type RestaurantTable } from '@/hooks/useTables';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Clock,
  DollarSign,
  Plus,
  ArrowRightLeft,
  Merge,
  Receipt,
  Sparkles,
  MoreVertical,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

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

const SECTIONS = [
  'Bar Area (1st Floor)',
  'Family Section (2nd Floor)',
  'DJ Area (2nd Floor)',
  'Outdoor',
  'Private Dining',
];

export default function Tables() {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add table form
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSection, setNewTableSection] = useState(SECTIONS[0]);
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [bulkCount, setBulkCount] = useState('1');

  const { data: sections } = useTableSections();
  const { data: tables, isLoading } = useTables(selectedSection === 'all' ? undefined : selectedSection);
  const updateTableStatus = useUpdateTableStatus();
  const queryClient = useQueryClient();

  const allSections = ['all', ...(sections || [])];

  const stats = {
    total: tables?.length || 0,
    free: tables?.filter(t => t.status === 'free').length || 0,
    occupied: tables?.filter(t => t.status === 'occupied').length || 0,
    reserved: tables?.filter(t => t.status === 'reserved').length || 0,
  };

  // Get next available table number
  const getNextTableNumber = () => {
    if (!tables || tables.length === 0) return 1;
    const maxNumber = Math.max(...tables.map(t => t.number));
    return maxNumber + 1;
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

  // Add new table(s)
  const handleAddTable = async () => {
    setIsProcessing(true);
    try {
      // Get organization_id
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (!org) throw new Error('No organization found');

      const count = parseInt(bulkCount) || 1;
      const startNumber = parseInt(newTableNumber) || getNextTableNumber();
      const capacity = parseInt(newTableCapacity) || 4;

      const tablesToAdd = [];
      for (let i = 0; i < count; i++) {
        tablesToAdd.push({
          organization_id: org.id,
          number: startNumber + i,
          section: newTableSection,
          capacity: capacity,
          status: 'free',
        });
      }

      const { error } = await supabase
        .from('restaurant_tables')
        .insert(tablesToAdd);

      if (error) throw error;

      toast.success(`${count} table(s) added successfully!`);
      setShowAddDialog(false);
      setNewTableNumber('');
      setBulkCount('1');
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
    } catch (error: any) {
      console.error('Add table error:', error);
      toast.error(error.message || 'Failed to add table');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete table
  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', selectedTable.id);

      if (error) throw error;

      toast.success(`Table ${selectedTable.number} deleted`);
      setShowDeleteDialog(false);
      setSelectedTable(null);
      queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
    } catch (error: any) {
      console.error('Delete table error:', error);
      toast.error(error.message || 'Failed to delete table');
    } finally {
      setIsProcessing(false);
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
          <Button onClick={() => {
            setNewTableNumber(String(getNextTableNumber()));
            setShowAddDialog(true);
          }}>
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
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {allSections.map((section) => (
            <Button
              key={section}
              variant={selectedSection === section ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedSection(section)}
              className="whitespace-nowrap"
            >
              {section === 'all' ? 'All Sections' : section}
            </Button>
          ))}
        </div>

        {/* Floor Plan */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : tables?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No tables found</p>
              <p className="text-sm text-muted-foreground mb-4">Add tables to get started</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add First Table
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {tables?.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 bg-gradient-to-br transition-all hover:scale-105 text-left',
                    statusBg[table.status as TableStatus],
                    selectedTable?.id === table.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    'absolute top-2 right-2 w-2 h-2 rounded-full',
                    statusColors[table.status as TableStatus],
                    table.status === 'occupied' && 'animate-pulse'
                  )} />

                  {/* Table Number */}
                  <div className="text-center">
                    <span className="text-2xl font-display font-bold">T{table.number}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {table.section.split('(')[0].trim()}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs mt-1">
                      <Users className="w-3 h-3" />
                      {table.capacity}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section Stats */}
        {sections && sections.length > 0 && (
          <div className="flex gap-4 pt-4 border-t mt-4 text-sm">
            {sections.map(section => {
              const count = tables?.filter(t => t.section === section).length || 0;
              const freeCount = tables?.filter(t => t.section === section && t.status === 'free').length || 0;
              return (
                <div key={section} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{section.split('(')[0].trim()}:</span>
                  <Badge variant="secondary">{freeCount}/{count}</Badge>
                </div>
              );
            })}
          </div>
        )}
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
                <X className="w-5 h-5" />
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
                {selectedTable.status === 'cleaning' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="justify-start col-span-2"
                    onClick={() => handleStatusChange(selectedTable.id, 'free')}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Mark as Ready
                  </Button>
                )}
              </div>
            </div>

            {/* Edit/Delete */}
            <div className="pt-4 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit Table
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={selectedTable.status === 'occupied'}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Table
              </Button>
              {selectedTable.status === 'occupied' && (
                <p className="text-xs text-muted-foreground">Cannot delete occupied table</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Table Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table(s)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starting Table Number</Label>
                <Input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 41"
                />
              </div>
              <div>
                <Label>Number of Tables</Label>
                <Input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div>
              <Label>Section</Label>
              <Select value={newTableSection} onValueChange={setNewTableSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Capacity (seats per table)</Label>
              <Input
                type="number"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                min="1"
                max="20"
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 text-sm">
              <p className="font-medium">Preview:</p>
              <p className="text-muted-foreground">
                Will create {bulkCount} table(s) numbered T{newTableNumber}
                {parseInt(bulkCount) > 1 && ` to T${parseInt(newTableNumber) + parseInt(bulkCount) - 1}`}
                {' '}in {newTableSection}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTable} disabled={isProcessing}>
              {isProcessing ? 'Adding...' : `Add ${bulkCount} Table(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table {selectedTable?.number}?</DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground">
            This action cannot be undone. Are you sure you want to delete this table?
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTable} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
