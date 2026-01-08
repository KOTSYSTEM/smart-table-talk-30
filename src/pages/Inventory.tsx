import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    TrendingDown,
    Truck,
    RefreshCw,
    Edit,
    Trash2,
    ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

interface InventoryItem {
    id: string;
    name: string;
    sku: string | null;
    category: string | null;
    unit: string;
    current_stock: number;
    min_stock_level: number;
    reorder_level: number | null;
    cost_per_unit: number;
    is_active: boolean;
    supplier?: { name: string } | null;
}

function useInventoryItems() {
    return useQuery({
        queryKey: ['inventory-items'],
        queryFn: async () => {
            // @ts-ignore - Table exists after migration
            const { data, error } = await supabase
                .from('inventory_items')
                .select(`
          *,
          supplier:suppliers(name)
        `)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data as InventoryItem[];
        },
    });
}

function useSuppliers() {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            // @ts-ignore - Table exists after migration
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data;
        },
    });
}

function useLowStockItems() {
    return useQuery({
        queryKey: ['low-stock-items'],
        queryFn: async () => {
            // @ts-ignore - Table exists after migration
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            // Filter low stock items
            return (data || []).filter((item: any) =>
                item.current_stock <= (item.min_stock_level || 0)
            );
        },
    });
}

export default function Inventory() {
    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const { data: items, isLoading } = useInventoryItems();
    const { data: suppliers } = useSuppliers();
    const { data: lowStockItems } = useLowStockItems();
    const queryClient = useQueryClient();

    // Filter items based on search
    const filteredItems = items?.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const totalItems = items?.length || 0;
    const lowStockCount = lowStockItems?.length || 0;
    const totalValue = items?.reduce((sum, item) =>
        sum + (item.current_stock * item.cost_per_unit), 0
    ) || 0;

    const getStockStatus = (item: InventoryItem) => {
        if (item.current_stock <= 0) return 'out';
        if (item.current_stock <= (item.min_stock_level || 0)) return 'low';
        if (item.reorder_level && item.current_stock <= item.reorder_level) return 'reorder';
        return 'ok';
    };

    const getStockBadge = (status: string) => {
        switch (status) {
            case 'out':
                return <Badge variant="destructive">Out of Stock</Badge>;
            case 'low':
                return <Badge variant="destructive" className="bg-orange-500">Low Stock</Badge>;
            case 'reorder':
                return <Badge variant="secondary" className="text-yellow-500">Reorder Soon</Badge>;
            default:
                return <Badge variant="secondary" className="text-emerald-500">In Stock</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Inventory</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage stock levels and suppliers
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync
                    </Button>
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Inventory Item</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <p className="text-muted-foreground text-center py-8">
                                    Item creation form coming soon...
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Items</p>
                                <p className="text-2xl font-bold">{totalItems}</p>
                            </div>
                            <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={lowStockCount > 0 ? 'border-orange-500/50' : ''}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-orange-500">{lowStockCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Suppliers</p>
                                <p className="text-2xl font-bold">{suppliers?.length || 0}</p>
                            </div>
                            <Truck className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Stock Value</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
                <Card className="border-orange-500/50 bg-orange-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            <div>
                                <p className="font-medium text-orange-500">
                                    {lowStockCount} items are running low on stock
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {lowStockItems?.map(item => (item as any).name).join(', ')}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto">
                                Create Purchase Order
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <Tabs defaultValue="items" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="items">
                        <Package className="w-4 h-4 mr-2" />
                        Items
                    </TabsTrigger>
                    <TabsTrigger value="suppliers">
                        <Truck className="w-4 h-4 mr-2" />
                        Suppliers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Inventory Items</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : filteredItems?.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">
                                        {searchQuery ? 'No items match your search' : 'No inventory items yet'}
                                    </p>
                                    <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Item
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Current Stock</TableHead>
                                            <TableHead>Min Level</TableHead>
                                            <TableHead>Unit Cost</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems?.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        {item.sku && (
                                                            <p className="text-xs text-muted-foreground">
                                                                SKU: {item.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.category || '-'}</TableCell>
                                                <TableCell>
                                                    <span className="font-mono">
                                                        {item.current_stock} {item.unit}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-muted-foreground">
                                                        {item.min_stock_level} {item.unit}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{formatCurrency(item.cost_per_unit)}</TableCell>
                                                <TableCell>{getStockBadge(getStockStatus(item))}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <ArrowUpDown className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="suppliers">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Suppliers</CardTitle>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Supplier
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {suppliers?.length === 0 ? (
                                <div className="text-center py-12">
                                    <Truck className="w-12 h-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">No suppliers yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Payment Terms</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suppliers?.map((supplier: any) => (
                                            <TableRow key={supplier.id}>
                                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                                <TableCell>{supplier.contact_person || '-'}</TableCell>
                                                <TableCell>{supplier.phone || '-'}</TableCell>
                                                <TableCell>{supplier.email || '-'}</TableCell>
                                                <TableCell>{supplier.payment_terms}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
