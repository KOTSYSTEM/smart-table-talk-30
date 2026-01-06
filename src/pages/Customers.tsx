import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Star,
  Gift,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MoreVertical
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visits: number;
  totalSpent: number;
  avgOrderValue: number;
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastVisit: Date;
  joinedAt: Date;
  favoriteItems: string[];
}

const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'John Smith',
    phone: '+1 234 567 8900',
    email: 'john@email.com',
    visits: 45,
    totalSpent: 2847.50,
    avgOrderValue: 63.28,
    loyaltyPoints: 2847,
    tier: 'gold',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60000),
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60000),
    favoriteItems: ['Grilled Salmon', 'Caesar Salad'],
  },
  {
    id: 'c2',
    name: 'Sarah Johnson',
    phone: '+1 234 567 8901',
    email: 'sarah@business.com',
    visits: 78,
    totalSpent: 5234.80,
    avgOrderValue: 67.11,
    loyaltyPoints: 5234,
    tier: 'platinum',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60000),
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60000),
    favoriteItems: ['Margherita Pizza', 'Tiramisu', 'Mojito'],
  },
  {
    id: 'c3',
    name: 'Mike Wilson',
    phone: '+1 234 567 8902',
    visits: 12,
    totalSpent: 456.30,
    avgOrderValue: 38.03,
    loyaltyPoints: 456,
    tier: 'bronze',
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60000),
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60000),
    favoriteItems: ['Classic Burger'],
  },
  {
    id: 'c4',
    name: 'Emily Brown',
    phone: '+1 234 567 8903',
    email: 'emily@email.com',
    visits: 28,
    totalSpent: 1567.40,
    avgOrderValue: 55.98,
    loyaltyPoints: 1567,
    tier: 'silver',
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60000),
    joinedAt: new Date(Date.now() - 120 * 24 * 60 * 60000),
    favoriteItems: ['Pasta Carbonara', 'Espresso'],
  },
];

const tierColors: Record<string, { bg: string; text: string }> = {
  bronze: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  silver: { bg: 'bg-slate-400/20', text: 'text-slate-300' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  platinum: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer profiles and loyalty programs
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold">1,247</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/40 p-4">
            <p className="text-sm text-muted-foreground">Gold+ Members</p>
            <p className="text-2xl font-bold text-yellow-400">128</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Points Issued</p>
            <p className="text-2xl font-bold">487K</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Avg. Lifetime Value</p>
            <p className="text-2xl font-bold text-primary">$892</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-0"
          />
        </div>

        {/* Customers List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={cn(
                'bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50',
                selectedCustomer?.id === customer.id && 'border-primary ring-1 ring-primary'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{customer.name}</h3>
                      <Badge className={cn(tierColors[customer.tier].bg, tierColors[customer.tier].text, 'capitalize')}>
                        <Star className="w-3 h-3 mr-1" /> {customer.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-primary">${customer.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{customer.visits} visits</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Detail Panel */}
      {selectedCustomer && (
        <div className="w-96 bg-card border border-border rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Customer Profile</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                {selectedCustomer.name.charAt(0)}
              </div>
              <h3 className="font-bold text-xl mt-3">{selectedCustomer.name}</h3>
              <Badge className={cn(tierColors[selectedCustomer.tier].bg, tierColors[selectedCustomer.tier].text, 'capitalize mt-2')}>
                <Star className="w-3 h-3 mr-1" /> {selectedCustomer.tier} Member
              </Badge>
            </div>

            {/* Loyalty Points */}
            <div className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-xl p-4 text-center">
              <Gift className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loyalty Points</p>
              <p className="text-3xl font-bold text-primary">{selectedCustomer.loyaltyPoints.toLocaleString()}</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-xl font-bold">{selectedCustomer.visits}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Avg. Order</p>
                <p className="text-xl font-bold">${selectedCustomer.avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-primary">${selectedCustomer.totalSpent.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Last Visit</p>
                <p className="text-xl font-bold">{formatDate(selectedCustomer.lastVisit)}</p>
              </div>
            </div>

            {/* Favorite Items */}
            <div>
              <h4 className="font-medium mb-2">Favorite Items</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCustomer.favoriteItems.map((item, i) => (
                  <Badge key={i} variant="secondary">{item}</Badge>
                ))}
              </div>
            </div>

            {/* Member Since */}
            <div className="p-3 bg-secondary/50 rounded-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {selectedCustomer.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary">View Orders</Button>
              <Button variant="secondary">Send Offer</Button>
            </div>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
