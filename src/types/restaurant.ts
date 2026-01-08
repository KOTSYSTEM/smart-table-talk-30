export type UserRole = 'owner' | 'manager' | 'waiter' | 'kitchen' | 'bar' | 'cashier' | 'delivery' | 'customer';

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'bill' | 'cleaning';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'online';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type KOTStatus = 'new' | 'in-progress' | 'ready' | 'served';

export interface Table {
  id: string;
  number: number;
  section: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  guestCount?: number;
  occupiedSince?: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  variants?: MenuItemVariant[];
  addons?: MenuAddon[];
  isAvailable: boolean;
  preparationTime: number; // in minutes
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceModifier: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  variant?: MenuItemVariant;
  addons?: MenuAddon[];
  notes?: string;
  status: KOTStatus;
  price: number;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  tableId?: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface DashboardStats {
  todaySales: number;
  ordersToday: number;
  averageOrderValue: number;
  tablesOccupied: number;
  totalTables: number;
  pendingOrders: number;
  activeKOTs: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}
