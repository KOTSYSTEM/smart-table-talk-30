import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useMenuItems, useToggleMenuItemAvailability, type MenuItemWithRelations } from '@/hooks/useMenuItems';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Clock,
  IndianRupee,
  Image,
  X
} from 'lucide-react';

export default function Menu() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems(selectedCategoryId, searchQuery);
  const toggleAvailability = useToggleMenuItemAvailability();

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ id, is_available: !currentStatus });
      toast.success(`Item ${!currentStatus ? 'enabled' : 'disabled'}`);
      if (selectedItem?.id === id) {
        setSelectedItem({ ...selectedItem, is_available: !currentStatus });
      }
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const isLoading = categoriesLoading || itemsLoading;

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Menu Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant's menu items and categories
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!selectedCategoryId ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategoryId(undefined)}
          >
            All Items
            <Badge variant="secondary" className="ml-2">
              {menuItems?.length || 0}
            </Badge>
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

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : menuItems?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No menu items found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    'bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg',
                    selectedItem?.id === item.id && 'border-primary ring-1 ring-primary',
                    !item.is_available && 'opacity-60'
                  )}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
                      {item.category?.icon || '🍽️'}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                        </div>
                        <Badge variant={item.is_available ? 'success' : 'secondary'}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <IndianRupee className="w-4 h-4" />
                          {Number(item.price)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.preparation_time}m
                        </div>
                        {item.variants && item.variants.length > 0 && (
                          <Badge variant="secondary">{item.variants.length} variants</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Panel */}
      {selectedItem && (
        <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Item Details</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Image */}
            <div className="aspect-video rounded-xl bg-secondary flex items-center justify-center text-6xl">
              {selectedItem.category?.icon || '🍽️'}
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="font-display font-bold text-xl">{selectedItem.name}</h3>
              <p className="text-muted-foreground mt-1">{selectedItem.description}</p>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
              <div>
                <p className="font-medium">Available for Order</p>
                <p className="text-sm text-muted-foreground">Show item on menu</p>
              </div>
              <Switch 
                checked={selectedItem.is_available} 
                onCheckedChange={() => handleToggleAvailability(selectedItem.id, selectedItem.is_available)}
                disabled={toggleAvailability.isPending}
              />
            </div>

            {/* Price & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(Number(selectedItem.price))}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Prep Time</p>
                <p className="text-2xl font-bold">{selectedItem.preparation_time}m</p>
              </div>
            </div>

            {/* Variants */}
            {selectedItem.variants && selectedItem.variants.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Variants</h4>
                <div className="space-y-2">
                  {selectedItem.variants.map((variant) => (
                    <div key={variant.id} className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                      <span>{variant.name}</span>
                      <span className="text-primary font-medium">
                        {Number(variant.price_modifier) > 0 ? '+' : ''}{formatCurrency(Number(variant.price_modifier))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{selectedItem.category?.name || 'Uncategorized'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button variant="secondary" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
            <Button className="w-full">
              <Image className="w-4 h-4 mr-2" /> Update Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
