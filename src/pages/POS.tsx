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
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Percent,
  User,
  StickyNote,
  QrCode,
  LayoutGrid,
  ShoppingBag,
  Check,
  X
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useMenuItems, type MenuItemWithRelations } from '@/hooks/useMenuItems';
import { useTables } from '@/hooks/useTables';
import { useCreateOrder } from '@/hooks/useOrders';
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
}

interface SelectedTable {
  id: string;
  number: number;
  section: string;
  capacity: number;
  status: string;
}

export default function POS() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems(selectedCategoryId, searchQuery);
  const { data: tables, isLoading: tablesLoading } = useTables();
  const createOrder = useCreateOrder();

  const availableItems = menuItems?.filter(item => item.is_available) || [];
  const freeTables = tables?.filter(t => t.status === 'free') || [];

  const addToCart = (item: MenuItemWithRelations) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1, price: (ci.quantity + 1) * Number(item.price) }
            : ci
        );
      }
      return [...prev, {
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuItem: item,
        quantity: 1,
        price: Number(item.price)
      }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity + delta);
          return newQty === 0 ? null : { ...item, quantity: newQty, price: newQty * Number(item.menuItem.price) };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedTable(null);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setDiscount(0);
  };

  const selectTable = (table: any) => {
    setSelectedTable({
      id: table.id,
      number: table.number,
      section: table.section,
      capacity: table.capacity,
      status: table.status
    });
    setTableDialogOpen(false);
    toast.success(`Table ${table.number} selected`);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = discountType === 'percent'
    ? (subtotal * discount / 100)
    : discount;
  const afterDiscount = subtotal - discountAmount;
  const cgst = (afterDiscount * TAX_CONFIG.CGST) / 100;
  const sgst = (afterDiscount * TAX_CONFIG.SGST) / 100;
  const tax = cgst + sgst;
  const total = afterDiscount + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select a table for dine-in order');
      setTableDialogOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Create the order
      const orderData = await createOrder.mutateAsync({
        order: {
          type: orderType,
          status: 'pending',
          subtotal,
          tax,
          discount: discountAmount,
          total,
          table_id: selectedTable?.id,
          notes: orderNotes || undefined,
        },
        items: cart.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: Number(item.menuItem.price),
          total_price: item.price,
          status: 'new',
          notes: item.notes,
        })),
      });

      // Update table status if dine-in
      if (selectedTable) {
        await supabase
          .from('restaurant_tables')
          .update({
            status: 'occupied',
            current_order_id: orderData.id,
            occupied_since: new Date().toISOString()
          })
          .eq('id', selectedTable.id);
      }

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        clearCart();
      }, 2000);

      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = categoriesLoading || itemsLoading;

  // Success overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-emerald-500 mb-2">Order Placed!</h2>
          <p className="text-muted-foreground">Order sent to kitchen</p>
          {selectedTable && (
            <p className="text-lg mt-2">Table {selectedTable.number}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 animate-fade-in">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Order Type Selector */}
        <div className="flex gap-2 mb-4">
          {(['dine_in', 'takeaway', 'delivery'] as const).map((type) => (
            <Button
              key={type}
              variant={orderType === type ? 'default' : 'secondary'}
              className={cn(
                "capitalize flex-1 h-12",
                orderType === type && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => {
                setOrderType(type);
                if (type !== 'dine_in') setSelectedTable(null);
              }}
            >
              {type === 'dine_in' ? '🍽️' : type === 'takeaway' ? '🥡' : '🚚'}
              <span className="ml-2">{type.replace('_', ' ')}</span>
            </Button>
          ))}
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
            className="whitespace-nowrap"
          >
            All Items
          </Button>
          {categoriesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" />
            ))
          ) : (
            categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategoryId === cat.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategoryId(cat.id)}
                className="whitespace-nowrap"
              >
                {cat.icon} {cat.name}
              </Button>
            ))
          )}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : availableItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No items available</p>
              <p className="text-sm text-muted-foreground">Try a different category or search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableItems.map((item) => {
                const inCart = cart.find(c => c.menuItem.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-lg transition-all active:scale-[0.98] group relative",
                      inCart && "border-primary bg-primary/5"
                    )}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="aspect-square rounded-lg bg-secondary mb-3 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                      {item.category?.icon || '🍽️'}
                    </div>
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">{formatCurrency(Number(item.price))}</span>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Current Order</h2>
            <div className="flex gap-2">
              <Badge variant="secondary">{cart.length} items</Badge>
              {cart.length > 0 && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCart}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Table Selection for Dine-in */}
          {orderType === 'dine_in' && (
            <Button
              variant={selectedTable ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              onClick={() => setTableDialogOpen(true)}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              {selectedTable
                ? `Table ${selectedTable.number} - ${selectedTable.section}`
                : 'Select Table'
              }
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No items in cart</p>
              <p className="text-sm text-muted-foreground">Tap items to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                  <p className="text-primary font-semibold text-sm">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-border p-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <User className="w-4 h-4 mr-1" /> Customer
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Percent className="w-4 h-4 mr-1" /> Discount
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <StickyNote className="w-4 h-4 mr-1" /> Note
            </Button>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST ({TAX_CONFIG.CGST}%)</span>
              <span>{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST ({TAX_CONFIG.SGST}%)</span>
              <span>{formatCurrency(sgst)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
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
                className="flex-col h-14 gap-1"
                onClick={() => setPaymentMethod(method as any)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          {/* Place Order Button */}
          <Button
            className="w-full h-14 text-lg font-bold"
            disabled={cart.length === 0 || isProcessing}
            onClick={handlePlaceOrder}
          >
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                Place Order • {formatCurrency(total)}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table Selection Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select a Table</DialogTitle>
          </DialogHeader>

          {tablesLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : freeTables.length === 0 ? (
            <div className="text-center py-12">
              <LayoutGrid className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No free tables available</p>
              <p className="text-sm text-muted-foreground mt-1">
                All tables are currently occupied
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {tables?.map((table) => {
                const isFree = table.status === 'free';
                const isSelected = selectedTable?.id === table.id;

                return (
                  <button
                    key={table.id}
                    onClick={() => isFree && selectTable(table)}
                    disabled={!isFree}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      isFree
                        ? "border-border hover:border-primary cursor-pointer bg-card"
                        : "border-border/50 cursor-not-allowed opacity-50 bg-muted",
                      isSelected && "border-primary bg-primary/10"
                    )}
                  >
                    <div className={cn(
                      "text-2xl font-bold mb-1",
                      isFree ? "text-foreground" : "text-muted-foreground"
                    )}>
                      T{table.number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {table.section}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {table.capacity} seats
                    </div>
                    <Badge
                      variant={isFree ? 'default' : 'secondary'}
                      className={cn(
                        "mt-2 text-xs",
                        isFree && "bg-emerald-500"
                      )}
                    >
                      {isFree ? 'Free' : table.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
