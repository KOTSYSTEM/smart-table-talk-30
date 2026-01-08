import { Table, MenuItem, Order, Category, DashboardStats } from '@/types/restaurant';

export const mockTables: Table[] = [
  { id: 't1', number: 1, section: 'Indoor', capacity: 2, status: 'occupied', guestCount: 2, occupiedSince: new Date(Date.now() - 45 * 60000) },
  { id: 't2', number: 2, section: 'Indoor', capacity: 4, status: 'free' },
  { id: 't3', number: 3, section: 'Indoor', capacity: 4, status: 'reserved' },
  { id: 't4', number: 4, section: 'Indoor', capacity: 6, status: 'occupied', guestCount: 4, occupiedSince: new Date(Date.now() - 30 * 60000) },
  { id: 't5', number: 5, section: 'Indoor', capacity: 2, status: 'bill' },
  { id: 't6', number: 6, section: 'Indoor', capacity: 4, status: 'free' },
  { id: 't7', number: 7, section: 'Outdoor', capacity: 4, status: 'occupied', guestCount: 3 },
  { id: 't8', number: 8, section: 'Outdoor', capacity: 6, status: 'free' },
  { id: 't9', number: 9, section: 'Outdoor', capacity: 2, status: 'cleaning' },
  { id: 't10', number: 10, section: 'Bar', capacity: 2, status: 'occupied', guestCount: 2 },
  { id: 't11', number: 11, section: 'Bar', capacity: 2, status: 'free' },
  { id: 't12', number: 12, section: 'Bar', capacity: 4, status: 'free' },
  { id: 't13', number: 13, section: 'Rooftop', capacity: 4, status: 'reserved' },
  { id: 't14', number: 14, section: 'Rooftop', capacity: 6, status: 'free' },
  { id: 't15', number: 15, section: 'Rooftop', capacity: 8, status: 'free' },
];

export const mockCategories: Category[] = [
  { id: 'starters', name: 'Starters', icon: '🥗', itemCount: 12 },
  { id: 'mains', name: 'Main Course', icon: '🍝', itemCount: 18 },
  { id: 'pizza', name: 'Pizza', icon: '🍕', itemCount: 8 },
  { id: 'burgers', name: 'Burgers', icon: '🍔', itemCount: 6 },
  { id: 'seafood', name: 'Seafood', icon: '🦐', itemCount: 10 },
  { id: 'indian', name: 'Indian', icon: '🍛', itemCount: 15 },
  { id: 'desserts', name: 'Desserts', icon: '🍰', itemCount: 8 },
  { id: 'beverages', name: 'Beverages', icon: '🥤', itemCount: 15 },
  { id: 'cocktails', name: 'Cocktails', icon: '🍹', itemCount: 12 },
];

export const mockMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Caesar Salad', description: 'Fresh romaine with parmesan and croutons', price: 349, category: 'starters', isAvailable: true, preparationTime: 10 },
  { id: 'm2', name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 279, category: 'starters', isAvailable: true, preparationTime: 8 },
  { id: 'm3', name: 'Grilled Salmon', description: 'Atlantic salmon with seasonal vegetables', price: 899, category: 'seafood', isAvailable: true, preparationTime: 20 },
  { id: 'm4', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, and basil', price: 449, category: 'pizza', isAvailable: true, preparationTime: 15, variants: [
    { id: 'v1', name: 'Regular (8")', priceModifier: 0 },
    { id: 'v2', name: 'Large (12")', priceModifier: 150 },
    { id: 'v3', name: 'Extra Large (16")', priceModifier: 250 },
  ]},
  { id: 'm5', name: 'Classic Burger', description: 'Angus beef with lettuce, tomato, and special sauce', price: 399, category: 'burgers', isAvailable: true, preparationTime: 15 },
  { id: 'm6', name: 'Pasta Carbonara', description: 'Creamy pasta with bacon and parmesan', price: 449, category: 'mains', isAvailable: true, preparationTime: 18 },
  { id: 'm7', name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 249, category: 'desserts', isAvailable: true, preparationTime: 5 },
  { id: 'm8', name: 'Mojito', description: 'Rum, mint, lime, and soda', price: 349, category: 'cocktails', isAvailable: true, preparationTime: 5 },
  { id: 'm9', name: 'Espresso', description: 'Double shot Italian espresso', price: 129, category: 'beverages', isAvailable: true, preparationTime: 2 },
  { id: 'm10', name: 'Lobster Risotto', description: 'Creamy arborio rice with fresh lobster', price: 1299, category: 'seafood', isAvailable: false, preparationTime: 25 },
  { id: 'm11', name: 'BBQ Chicken Wings', description: 'Crispy wings with house BBQ sauce', price: 379, category: 'starters', isAvailable: true, preparationTime: 12 },
  { id: 'm12', name: 'Pepperoni Pizza', description: 'Spicy pepperoni with mozzarella', price: 549, category: 'pizza', isAvailable: true, preparationTime: 15 },
  { id: 'm13', name: 'Butter Chicken', description: 'Creamy tomato gravy with tender chicken', price: 449, category: 'indian', isAvailable: true, preparationTime: 20 },
  { id: 'm14', name: 'Dal Makhani', description: 'Slow-cooked black lentils in creamy gravy', price: 349, category: 'indian', isAvailable: true, preparationTime: 15 },
  { id: 'm15', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 399, category: 'indian', isAvailable: true, preparationTime: 18 },
  { id: 'm16', name: 'Biryani', description: 'Fragrant basmati rice with aromatic spices', price: 449, category: 'indian', isAvailable: true, preparationTime: 25, variants: [
    { id: 'v4', name: 'Chicken', priceModifier: 0 },
    { id: 'v5', name: 'Mutton', priceModifier: 150 },
    { id: 'v6', name: 'Veg', priceModifier: -50 },
  ]},
];

export const mockOrders: Order[] = [
  {
    id: 'o1',
    type: 'dine-in',
    status: 'preparing',
    tableId: 't1',
    items: [
      { id: 'oi1', menuItem: mockMenuItems[0], quantity: 2, status: 'in-progress', price: 698 },
      { id: 'oi2', menuItem: mockMenuItems[5], quantity: 1, status: 'new', price: 449 },
    ],
    subtotal: 1147,
    tax: 57,
    discount: 0,
    total: 1204,
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o2',
    type: 'delivery',
    status: 'pending',
    items: [
      { id: 'oi3', menuItem: mockMenuItems[4], quantity: 2, status: 'new', price: 798 },
      { id: 'oi4', menuItem: mockMenuItems[8], quantity: 2, status: 'new', price: 258 },
    ],
    subtotal: 1056,
    tax: 53,
    discount: 100,
    total: 1009,
    createdAt: new Date(Date.now() - 5 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o3',
    type: 'takeaway',
    status: 'ready',
    items: [
      { id: 'oi5', menuItem: mockMenuItems[3], quantity: 1, status: 'ready', price: 449 },
    ],
    subtotal: 449,
    tax: 22,
    discount: 0,
    total: 471,
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o4',
    type: 'dine-in',
    status: 'served',
    tableId: 't4',
    items: [
      { id: 'oi6', menuItem: mockMenuItems[2], quantity: 2, status: 'served', price: 1798 },
      { id: 'oi7', menuItem: mockMenuItems[7], quantity: 4, status: 'served', price: 1396 },
    ],
    subtotal: 3194,
    tax: 160,
    discount: 200,
    total: 3154,
    createdAt: new Date(Date.now() - 45 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o5',
    type: 'dine-in',
    status: 'preparing',
    tableId: 't7',
    items: [
      { id: 'oi8', menuItem: mockMenuItems[12], quantity: 2, status: 'in-progress', price: 898 },
      { id: 'oi9', menuItem: mockMenuItems[15], quantity: 1, status: 'new', price: 449 },
      { id: 'oi10', menuItem: mockMenuItems[13], quantity: 1, status: 'new', price: 349 },
    ],
    subtotal: 1696,
    tax: 85,
    discount: 0,
    total: 1781,
    createdAt: new Date(Date.now() - 10 * 60000),
    updatedAt: new Date(),
  },
];

export const mockDashboardStats: DashboardStats = {
  todaySales: 156780,
  ordersToday: 67,
  averageOrderValue: 2340,
  tablesOccupied: 5,
  totalTables: 15,
  pendingOrders: 8,
  activeKOTs: 12,
};

// Staff data for Staff module
export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'on-leave';
  joiningDate: Date;
  salary: number;
  avatar?: string;
}

export const mockStaff: Staff[] = [
  { id: 's1', name: 'Rahul Sharma', role: 'Manager', email: 'rahul@restaurant.com', phone: '+91 98765 43210', status: 'active', joiningDate: new Date('2023-01-15'), salary: 45000 },
  { id: 's2', name: 'Priya Patel', role: 'Chef', email: 'priya@restaurant.com', phone: '+91 98765 43211', status: 'active', joiningDate: new Date('2023-03-20'), salary: 35000 },
  { id: 's3', name: 'Amit Kumar', role: 'Waiter', email: 'amit@restaurant.com', phone: '+91 98765 43212', status: 'active', joiningDate: new Date('2023-06-10'), salary: 18000 },
  { id: 's4', name: 'Neha Singh', role: 'Cashier', email: 'neha@restaurant.com', phone: '+91 98765 43213', status: 'active', joiningDate: new Date('2023-04-01'), salary: 22000 },
  { id: 's5', name: 'Vikram Rao', role: 'Delivery', email: 'vikram@restaurant.com', phone: '+91 98765 43214', status: 'active', joiningDate: new Date('2023-07-15'), salary: 15000 },
  { id: 's6', name: 'Anita Devi', role: 'Kitchen Staff', email: 'anita@restaurant.com', phone: '+91 98765 43215', status: 'on-leave', joiningDate: new Date('2023-02-28'), salary: 16000 },
];

// Inventory data for Inventory module
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: Date;
  expiryDate?: Date;
}

export const mockInventory: InventoryItem[] = [
  { id: 'i1', name: 'Chicken Breast', category: 'Meat', quantity: 25, unit: 'kg', reorderLevel: 10, costPerUnit: 280, supplier: 'Fresh Farms', lastRestocked: new Date(Date.now() - 2 * 86400000) },
  { id: 'i2', name: 'Basmati Rice', category: 'Grains', quantity: 50, unit: 'kg', reorderLevel: 20, costPerUnit: 120, supplier: 'Grain House', lastRestocked: new Date(Date.now() - 5 * 86400000) },
  { id: 'i3', name: 'Tomatoes', category: 'Vegetables', quantity: 15, unit: 'kg', reorderLevel: 10, costPerUnit: 40, supplier: 'Local Market', lastRestocked: new Date(Date.now() - 1 * 86400000), expiryDate: new Date(Date.now() + 5 * 86400000) },
  { id: 'i4', name: 'Olive Oil', category: 'Oils', quantity: 8, unit: 'liters', reorderLevel: 5, costPerUnit: 650, supplier: 'Italian Imports', lastRestocked: new Date(Date.now() - 10 * 86400000) },
  { id: 'i5', name: 'Paneer', category: 'Dairy', quantity: 12, unit: 'kg', reorderLevel: 8, costPerUnit: 320, supplier: 'Dairy Fresh', lastRestocked: new Date(Date.now() - 1 * 86400000), expiryDate: new Date(Date.now() + 7 * 86400000) },
  { id: 'i6', name: 'Mozzarella Cheese', category: 'Dairy', quantity: 6, unit: 'kg', reorderLevel: 5, costPerUnit: 580, supplier: 'Cheese World', lastRestocked: new Date(Date.now() - 3 * 86400000), expiryDate: new Date(Date.now() + 14 * 86400000) },
  { id: 'i7', name: 'Onions', category: 'Vegetables', quantity: 30, unit: 'kg', reorderLevel: 15, costPerUnit: 35, supplier: 'Local Market', lastRestocked: new Date(Date.now() - 2 * 86400000) },
  { id: 'i8', name: 'Garam Masala', category: 'Spices', quantity: 3, unit: 'kg', reorderLevel: 2, costPerUnit: 450, supplier: 'Spice Hub', lastRestocked: new Date(Date.now() - 15 * 86400000) },
];

// Customer data with loyalty
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  visits: number;
  lastVisit: Date;
  preferences?: string[];
}

export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Rajesh Gupta', email: 'rajesh@email.com', phone: '+91 99876 54321', loyaltyPoints: 2450, tier: 'gold', totalSpent: 48500, visits: 23, lastVisit: new Date(Date.now() - 2 * 86400000), preferences: ['spicy', 'vegetarian'] },
  { id: 'c2', name: 'Sunita Agarwal', email: 'sunita@email.com', phone: '+91 99876 54322', loyaltyPoints: 850, tier: 'silver', totalSpent: 18200, visits: 12, lastVisit: new Date(Date.now() - 5 * 86400000) },
  { id: 'c3', name: 'Mohammed Ali', email: 'ali@email.com', phone: '+91 99876 54323', loyaltyPoints: 4200, tier: 'platinum', totalSpent: 87500, visits: 45, lastVisit: new Date(Date.now() - 1 * 86400000), preferences: ['non-veg', 'seafood'] },
  { id: 'c4', name: 'Kavitha Reddy', email: 'kavitha@email.com', phone: '+91 99876 54324', loyaltyPoints: 320, tier: 'bronze', totalSpent: 6800, visits: 5, lastVisit: new Date(Date.now() - 10 * 86400000) },
  { id: 'c5', name: 'Arjun Nair', email: 'arjun@email.com', phone: '+91 99876 54325', loyaltyPoints: 1680, tier: 'silver', totalSpent: 32400, visits: 18, lastVisit: new Date(Date.now() - 3 * 86400000), preferences: ['healthy', 'low-carb'] },
];

// Reservation data
export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: Date;
  time: string;
  partySize: number;
  tableId?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
}

export const mockReservations: Reservation[] = [
  { id: 'r1', customerName: 'Vikram Mehta', customerPhone: '+91 98123 45678', date: new Date(), time: '19:00', partySize: 4, tableId: 't3', status: 'confirmed', specialRequests: 'Window seat preferred' },
  { id: 'r2', customerName: 'Priyanka Chopra', customerPhone: '+91 98123 45679', date: new Date(), time: '20:30', partySize: 6, tableId: 't13', status: 'confirmed' },
  { id: 'r3', customerName: 'Anil Kapoor', customerPhone: '+91 98123 45680', date: new Date(Date.now() + 86400000), time: '13:00', partySize: 2, status: 'pending' },
  { id: 'r4', customerName: 'Deepika Singh', customerPhone: '+91 98123 45681', date: new Date(Date.now() + 86400000), time: '20:00', partySize: 8, status: 'pending', specialRequests: 'Birthday celebration, need cake' },
];
