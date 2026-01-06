import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { mockCategories, mockMenuItems } from '@/data/mockData';
import { MenuItem } from '@/types/restaurant';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Image,
  MoreVertical
} from 'lucide-react';

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = mockMenuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryIcons: Record<string, string> = {
    starters: '🥗',
    mains: '🍝',
    pizza: '🍕',
    burgers: '🍔',
    seafood: '🦐',
    desserts: '🍰',
    beverages: '🥤',
    cocktails: '🍹',
  };

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
            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Items
            <Badge variant="secondary" className="ml-2">
              {mockMenuItems.length}
            </Badge>
          </Button>
          {mockCategories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.icon} {cat.name}
              <Badge variant="secondary" className="ml-2">
                {cat.itemCount}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  'bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg',
                  selectedItem?.id === item.id && 'border-primary ring-1 ring-primary',
                  !item.isAvailable && 'opacity-60'
                )}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
                    {categoryIcons[item.category] || '🍽️'}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                      <Badge variant={item.isAvailable ? 'success' : 'secondary'}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <DollarSign className="w-4 h-4" />
                        {item.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {item.preparationTime}m
                      </div>
                      {item.variants && (
                        <Badge variant="secondary">{item.variants.length} variants</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item Detail Panel */}
      {selectedItem && (
        <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Item Details</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Image */}
            <div className="aspect-video rounded-xl bg-secondary flex items-center justify-center text-6xl">
              {categoryIcons[selectedItem.category] || '🍽️'}
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
              <Switch checked={selectedItem.isAvailable} />
            </div>

            {/* Price & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-primary">${selectedItem.price.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Prep Time</p>
                <p className="text-2xl font-bold">{selectedItem.preparationTime}m</p>
              </div>
            </div>

            {/* Variants */}
            {selectedItem.variants && (
              <div>
                <h4 className="font-medium mb-2">Variants</h4>
                <div className="space-y-2">
                  {selectedItem.variants.map((variant) => (
                    <div key={variant.id} className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                      <span>{variant.name}</span>
                      <span className="text-primary font-medium">
                        {variant.priceModifier > 0 ? '+' : ''}${variant.priceModifier.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{selectedItem.category}</p>
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
