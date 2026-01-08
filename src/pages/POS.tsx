import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  LayoutGrid,
  ShoppingBag,
  Check,
  X,
  Send,
  Receipt,
  ChefHat,
  ArrowLeft,
  Users,
  Clock
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useMenuItems, type MenuItemWithRelations } from '@/hooks/useMenuItems';
import { useTables } from '@/hooks/useTables';
import { useCreateOrder, useOrders } from '@/hooks/useOrders';
import { formatCurrency, TAX_CONFIG } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  menuItem: MenuItemWithRelations;
  quantity: number;
  price: number;
  notes?: string;
  isNew?: boolean; // Track new items for current KOT
}

interface SelectedTable {
  id: string;
  number: number;
  section: string;
  capacity: number;
  status: string;
  currentOrderId?: string;
}

type POSStep = 'select-table' | 'take-order' | 'generate-bill' | 'payment';

export default function POS() {
  // Current step in workflow
  const [currentStep, setCurrentStep] = useState<POSStep>('select-table');

  // Table & Order state
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [existingItems, setExistingItems] = useState<CartItem[]>([]);
  const [newItems, setNewItems] = useState<CartItem[]>([]);
  const [kotNumber, setKotNumber] = useState(1);

  // Menu state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [guestCount, setGuestCount] = useState(2);

  // Data hooks
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems(selectedCategoryId, searchQuery);
  const { data: tables, isLoading: tablesLoading } = useTables();
  const createOrder = useCreateOrder();

  const availableItems = menuItems?.filter(item => item.is_available) || [];
  const allItems = [...existingItems, ...newItems];

  // Calculate totals
  const subtotal = allItems.reduce((sum, item) => sum + item.price, 0);
  const cgst = (subtotal * TAX_CONFIG.CGST) / 100;
  const sgst = (subtotal * TAX_CONFIG.SGST) / 100;
  const tax = cgst + sgst;
  const total = subtotal + tax;

  // Add item to current KOT
  const addToCart = (item: MenuItemWithRelations) => {
    setNewItems(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1, price: (ci.quantity + 1) * Number(item.price) }
            : ci
        );
      }
      return [...prev, {
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuItem: item,
        quantity: 1,
        price: Number(item.price),
        isNew: true
      }];
    });
    toast.success(`${item.name} added`);
  };

  const updateQuantity = (itemId: string, delta: number, isNewItem: boolean) => {
    const setter = isNewItem ? setNewItems : setExistingItems;
    setter(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity + delta);
          return newQty === 0 ? null : { ...item, quantity: newQty, price: newQty * Number(item.menuItem.price) };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (itemId: string, isNewItem: boolean) => {
    const setter = isNewItem ? setNewItems : setExistingItems;
    setter(prev => prev.filter(item => item.id !== itemId));
  };

  // Select table and start order
  const selectTable = async (table: any) => {
    setSelectedTable({
      id: table.id,
      number: table.number,
      section: table.section,
      capacity: table.capacity,
      status: table.status,
      currentOrderId: table.current_order_id
    });

    // If table has existing order, load it
    if (table.current_order_id) {
      // TODO: Load existing order items
      setCurrentOrderId(table.current_order_id);
      setKotNumber(2); // Assuming at least 1 KOT exists
    }

    setCurrentStep('take-order');
    toast.success(`Table ${table.number} selected`);
  };

  // Send KOT to kitchen
  const sendKOT = async () => {
    if (newItems.length === 0) {
      toast.error('Add items before sending KOT');
      return;
    }

    setIsProcessing(true);

    try {
      if (!currentOrderId) {
        // Create new order
        const orderData = await createOrder.mutateAsync({
          order: {
            type: 'dine_in',
            status: 'preparing',
            subtotal: newItems.reduce((sum, item) => sum + item.price, 0),
            tax: 0,
            discount: 0,
            total: newItems.reduce((sum, item) => sum + item.price, 0),
            table_id: selectedTable?.id,
          },
          items: newItems.map(item => ({
            menu_item_id: item.menuItem.id,
            quantity: item.quantity,
            unit_price: Number(item.menuItem.price),
            total_price: item.price,
            status: 'new',
            notes: item.notes,
          })),
        });

        setCurrentOrderId(orderData.id);

        // Update table status
        if (selectedTable) {
          await supabase
            .from('restaurant_tables')
            .update({
              status: 'occupied',
              current_order_id: orderData.id,
              occupied_since: new Date().toISOString(),
              guest_count: guestCount
            })
            .eq('id', selectedTable.id);
        }
      } else {
        // Add items to existing order
        const orderItems = newItems.map(item => ({
          order_id: currentOrderId,
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: Number(item.menuItem.price),
          total_price: item.price,
          status: 'new',
          notes: item.notes,
        }));

        const { error } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (error) throw error;
      }

      // Move new items to existing
      setExistingItems(prev => [...prev, ...newItems.map(item => ({ ...item, isNew: false }))]);
      setNewItems([]);
      setKotNumber(k => k + 1);

      toast.success(`KOT #${kotNumber} sent to kitchen! 🍳`);
    } catch (error) {
      console.error('KOT error:', error);
      toast.error('Failed to send KOT');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate bill
  const generateBill = () => {
    if (allItems.length === 0) {
      toast.error('No items to bill');
      return;
    }
    setCurrentStep('generate-bill');
    setShowBillDialog(true);
  };

  // Complete payment
  const completePayment = async () => {
    setIsProcessing(true);

    try {
      // Update order with final totals and status
      if (currentOrderId) {
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            subtotal,
            tax,
            total,
          })
          .eq('id', currentOrderId);

        // Free up the table
        if (selectedTable) {
          await supabase
            .from('restaurant_tables')
            .update({
              status: 'cleaning',
              current_order_id: null,
              guest_count: 0
            })
            .eq('id', selectedTable.id);
        }
      }

      setShowBillDialog(false);
      setShowSuccess(true);

      setTimeout(() => {
        // Reset everything
        setShowSuccess(false);
        setSelectedTable(null);
        setCurrentOrderId(null);
        setExistingItems([]);
        setNewItems([]);
        setKotNumber(1);
        setCurrentStep('select-table');
      }, 3000);

      toast.success('Payment completed! 🎉');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Back to table selection
  const backToTables = () => {
    if (allItems.length > 0) {
      if (!confirm('You have unsent items. Are you sure you want to go back?')) {
        return;
      }
    }
    setSelectedTable(null);
    setCurrentOrderId(null);
    setExistingItems([]);
    setNewItems([]);
    setKotNumber(1);
    setCurrentStep('select-table');
  };

  // Success overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-emerald-500 mb-2">Payment Complete!</h2>
          <p className="text-muted-foreground">Table {selectedTable?.number} is now free</p>
          <p className="text-2xl font-bold mt-4">{formatCurrency(total)}</p>
        </div>
      </div>
    );
  }

  // Step 1: Table Selection
  if (currentStep === 'select-table') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Select Table</h1>
          <p className="text-muted-foreground mt-1">Choose a table to start taking orders</p>
        </div>

        {tablesLoading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {tables?.map((table) => {
              const isFree = table.status === 'free';
              const isOccupied = table.status === 'occupied';

              return (
                <button
                  key={table.id}
                  onClick={() => selectTable(table)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center hover:scale-105",
                    isFree && "border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500",
                    isOccupied && "border-amber-500/50 bg-amber-500/10 hover:border-amber-500",
                    !isFree && !isOccupied && "border-border bg-muted opacity-50"
                  )}
                >
                  <div className="text-2xl font-bold mb-1">T{table.number}</div>
                  <div className="text-xs text-muted-foreground mb-2">{table.section}</div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isFree && "bg-emerald-500/20 text-emerald-500",
                      isOccupied && "bg-amber-500/20 text-amber-500"
                    )}
                  >
                    {isFree ? 'Free' : isOccupied ? 'Occupied' : table.status}
                  </Badge>
                  {isOccupied && table.guest_count && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {table.guest_count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-sm">Free ({tables?.filter(t => t.status === 'free').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-sm">Occupied ({tables?.filter(t => t.status === 'occupied').length})</span>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Take Order
  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 animate-fade-in">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Table Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={backToTables}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">Table {selectedTable?.number}</h2>
              <p className="text-sm text-muted-foreground">{selectedTable?.section}</p>
            </div>
            <Badge variant="secondary" className="text-amber-500 bg-amber-500/20">
              <Users className="w-3 h-3 mr-1" />
              {guestCount} Guests
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">KOT #{kotNumber}</Badge>
            {currentOrderId && (
              <Badge variant="secondary" className="text-emerald-500">
                Order Active
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-0 h-12"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!selectedCategoryId ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategoryId(undefined)}
          >
            All
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategoryId(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto">
          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableItems.map((item) => {
                const inCart = newItems.find(c => c.menuItem.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "bg-card border border-border rounded-xl p-3 text-left hover:border-primary/50 transition-all active:scale-[0.98] relative",
                      inCart && "border-primary bg-primary/5"
                    )}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="text-3xl mb-2">{item.category?.icon || '🍽️'}</div>
                    <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                    <span className="text-primary font-bold text-sm">{formatCurrency(Number(item.price))}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order Panel */}
      <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        {/* Order Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">Order</h2>
            <Badge variant="secondary">{allItems.length} items</Badge>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items yet</p>
              <p className="text-sm text-muted-foreground">Tap menu items to add</p>
            </div>
          ) : (
            <>
              {/* Existing items (already sent via KOT) */}
              {existingItems.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <ChefHat className="w-3 h-3" /> Sent to Kitchen
                  </div>
                  {existingItems.map((item) => (
                    <div key={item.id} className="flex gap-2 p-2 bg-secondary/30 rounded-lg mb-1 opacity-70">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <span className="text-sm">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* New items (current KOT) */}
              {newItems.length > 0 && (
                <div>
                  <div className="text-xs text-primary mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> New Items (KOT #{kotNumber})
                  </div>
                  {newItems.map((item) => (
                    <div key={item.id} className="flex gap-2 p-2 bg-primary/10 rounded-lg mb-1 border border-primary/20">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                        <p className="text-primary font-semibold text-sm">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1, true)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1, true)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeItem(item.id, true)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Footer */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({TAX_CONFIG.CGST + TAX_CONFIG.SGST}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-1 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Send KOT Button */}
            <Button
              className="w-full h-12"
              variant={newItems.length > 0 ? 'default' : 'secondary'}
              disabled={newItems.length === 0 || isProcessing}
              onClick={sendKOT}
            >
              <Send className="w-4 h-4 mr-2" />
              {isProcessing ? 'Sending...' : `Send KOT #${kotNumber}`}
              {newItems.length > 0 && ` (${newItems.length} items)`}
            </Button>

            {/* Generate Bill Button */}
            <Button
              className="w-full h-12"
              variant="outline"
              disabled={allItems.length === 0 || newItems.length > 0}
              onClick={generateBill}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Generate Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Bill & Payment Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Bill - Table {selectedTable?.number}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bill Items */}
            <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              {allItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.menuItem.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>

            {/* Bill Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CGST ({TAX_CONFIG.CGST}%)</span>
                <span>{formatCurrency(cgst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST ({TAX_CONFIG.SGST}%)</span>
                <span>{formatCurrency(sgst)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { method: 'cash', icon: Banknote, label: 'Cash' },
                { method: 'card', icon: CreditCard, label: 'Card' },
                { method: 'upi', icon: QrCode, label: 'UPI' },
                { method: 'wallet', icon: Smartphone, label: 'Wallet' },
              ].map(({ method, icon: Icon, label }) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  size="sm"
                  className="flex-col h-16 gap-1"
                  onClick={() => setPaymentMethod(method as any)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={completePayment} disabled={isProcessing} className="min-w-32">
              {isProcessing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
