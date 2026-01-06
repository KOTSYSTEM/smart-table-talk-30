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
  { id: 'desserts', name: 'Desserts', icon: '🍰', itemCount: 8 },
  { id: 'beverages', name: 'Beverages', icon: '🥤', itemCount: 15 },
  { id: 'cocktails', name: 'Cocktails', icon: '🍹', itemCount: 12 },
];

export const mockMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Caesar Salad', description: 'Fresh romaine with parmesan and croutons', price: 12.99, category: 'starters', isAvailable: true, preparationTime: 10 },
  { id: 'm2', name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 9.99, category: 'starters', isAvailable: true, preparationTime: 8 },
  { id: 'm3', name: 'Grilled Salmon', description: 'Atlantic salmon with seasonal vegetables', price: 28.99, category: 'seafood', isAvailable: true, preparationTime: 20 },
  { id: 'm4', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, and basil', price: 16.99, category: 'pizza', isAvailable: true, preparationTime: 15, variants: [
    { id: 'v1', name: 'Regular', priceModifier: 0 },
    { id: 'v2', name: 'Large', priceModifier: 4 },
    { id: 'v3', name: 'Extra Large', priceModifier: 7 },
  ]},
  { id: 'm5', name: 'Classic Burger', description: 'Angus beef with lettuce, tomato, and special sauce', price: 18.99, category: 'burgers', isAvailable: true, preparationTime: 15 },
  { id: 'm6', name: 'Pasta Carbonara', description: 'Creamy pasta with bacon and parmesan', price: 17.99, category: 'mains', isAvailable: true, preparationTime: 18 },
  { id: 'm7', name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 8.99, category: 'desserts', isAvailable: true, preparationTime: 5 },
  { id: 'm8', name: 'Mojito', description: 'Rum, mint, lime, and soda', price: 11.99, category: 'cocktails', isAvailable: true, preparationTime: 5 },
  { id: 'm9', name: 'Espresso', description: 'Double shot Italian espresso', price: 3.99, category: 'beverages', isAvailable: true, preparationTime: 2 },
  { id: 'm10', name: 'Lobster Risotto', description: 'Creamy arborio rice with fresh lobster', price: 34.99, category: 'seafood', isAvailable: false, preparationTime: 25 },
  { id: 'm11', name: 'BBQ Chicken Wings', description: 'Crispy wings with house BBQ sauce', price: 14.99, category: 'starters', isAvailable: true, preparationTime: 12 },
  { id: 'm12', name: 'Pepperoni Pizza', description: 'Spicy pepperoni with mozzarella', price: 18.99, category: 'pizza', isAvailable: true, preparationTime: 15 },
];

export const mockOrders: Order[] = [
  {
    id: 'o1',
    type: 'dine-in',
    status: 'preparing',
    tableId: 't1',
    items: [
      { id: 'oi1', menuItem: mockMenuItems[0], quantity: 2, status: 'in-progress', price: 25.98 },
      { id: 'oi2', menuItem: mockMenuItems[5], quantity: 1, status: 'new', price: 17.99 },
    ],
    subtotal: 43.97,
    tax: 4.40,
    discount: 0,
    total: 48.37,
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o2',
    type: 'delivery',
    status: 'pending',
    items: [
      { id: 'oi3', menuItem: mockMenuItems[4], quantity: 2, status: 'new', price: 37.98 },
      { id: 'oi4', menuItem: mockMenuItems[8], quantity: 2, status: 'new', price: 7.98 },
    ],
    subtotal: 45.96,
    tax: 4.60,
    discount: 5.00,
    total: 45.56,
    createdAt: new Date(Date.now() - 5 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o3',
    type: 'takeaway',
    status: 'ready',
    items: [
      { id: 'oi5', menuItem: mockMenuItems[3], quantity: 1, status: 'ready', price: 16.99 },
    ],
    subtotal: 16.99,
    tax: 1.70,
    discount: 0,
    total: 18.69,
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'o4',
    type: 'dine-in',
    status: 'served',
    tableId: 't4',
    items: [
      { id: 'oi6', menuItem: mockMenuItems[2], quantity: 2, status: 'served', price: 57.98 },
      { id: 'oi7', menuItem: mockMenuItems[7], quantity: 4, status: 'served', price: 47.96 },
    ],
    subtotal: 105.94,
    tax: 10.59,
    discount: 10.00,
    total: 106.53,
    createdAt: new Date(Date.now() - 45 * 60000),
    updatedAt: new Date(),
  },
];

export const mockDashboardStats: DashboardStats = {
  todaySales: 4528.50,
  ordersToday: 67,
  averageOrderValue: 67.59,
  tablesOccupied: 5,
  totalTables: 15,
  pendingOrders: 8,
  activeKOTs: 12,
};
