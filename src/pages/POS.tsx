import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  ShoppingBag
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useMenuItems, type MenuItemWithRelations } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import { formatCurrency, TAX_CONFIG } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  menuItem: MenuItemWithRelations;
  quantity: number;
  price: number;
}

export default function POS() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems(selectedCategoryId, searchQuery);
  const createOrder = useCreateOrder();

  const availableItems = menuItems?.filter(item => item.is_available) || [];

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
        id: `oi-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        price: Number(item.price)
      }];
    });
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

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cgst = (subtotal * TAX_CONFIG.CGST) / 100;
  const sgst = (subtotal * TAX_CONFIG.SGST) / 100;
  const tax = cgst + sgst;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    try {
      await createOrder.mutateAsync({
        order: {
          type: orderType,
          status: 'pending',
          subtotal,
          tax,
          discount: 0,
          total,
        },
        items: cart.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: Number(item.menuItem.price),
          total_price: item.price,
          status: 'new',
        })),
      });
      
      toast.success('Order placed successfully!');
      setCart([]);
    } catch {
      toast.error('Failed to place order');
    }
  };

  const isLoading = categoriesLoading || itemsLoading;

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
              className="capitalize"
              onClick={() => setOrderType(type)}
            >
              {type === 'dine_in' ? '🍽️' : type === 'takeaway' ? '🥡' : '🚚'} {type.replace('_', '-')}
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
            className="pl-10 bg-secondary border-0"
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
          {categoriesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20" />
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
              <p className="text-muted-foreground">No items available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-lg transition-all active:scale-[0.98] group"
                >
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-lg">Current Order</h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>
          {orderType === 'dine_in' && (
            <Button variant="outline" size="sm" className="w-full">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Select Table
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
                  <p className="text-primary font-semibold text-sm">{formatCurrency(Number(item.menuItem.price))}</p>
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
            <Button variant="secondary" size="sm" className="flex-1">
              <User className="w-4 h-4 mr-1" /> Customer
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              <Percent className="w-4 h-4 mr-1" /> Discount
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              <StickyNote className="w-4 h-4 mr-1" /> Note
            </Button>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>CGST ({TAX_CONFIG.CGST}%)</span>
              <span>{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>SGST ({TAX_CONFIG.SGST}%)</span>
              <span>{formatCurrency(sgst)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button variant="secondary" className="flex-col h-auto py-3">
              <Banknote className="w-5 h-5 mb-1" />
              <span className="text-xs">Cash</span>
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-3">
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-xs">Card</span>
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-3">
              <QrCode className="w-5 h-5 mb-1" />
              <span className="text-xs">UPI</span>
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-3">
              <Smartphone className="w-5 h-5 mb-1" />
              <span className="text-xs">Wallet</span>
            </Button>
          </div>

          <Button 
            className="w-full h-12 text-base font-semibold shadow-glow" 
            disabled={cart.length === 0 || createOrder.isPending}
            onClick={handlePlaceOrder}
          >
            {createOrder.isPending ? 'Placing Order...' : `Place Order • ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
