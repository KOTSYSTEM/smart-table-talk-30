
-- Create enums
CREATE TYPE public.table_status AS ENUM ('free', 'occupied', 'reserved', 'bill', 'cleaning');
CREATE TYPE public.order_type AS ENUM ('dine_in', 'takeaway', 'delivery', 'online');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled');
CREATE TYPE public.kot_status AS ENUM ('new', 'in_progress', 'ready', 'served');
CREATE TYPE public.customer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🍽️',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  preparation_time INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu_item_variants table
CREATE TABLE public.menu_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu_item_addons table
CREATE TABLE public.menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant_tables table
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL UNIQUE,
  section TEXT NOT NULL DEFAULT 'Main',
  capacity INTEGER NOT NULL DEFAULT 4,
  status public.table_status NOT NULL DEFAULT 'free',
  guest_count INTEGER,
  occupied_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  tier public.customer_tier NOT NULL DEFAULT 'bronze',
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMPTZ,
  preferences TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  type public.order_type NOT NULL DEFAULT 'dine_in',
  status public.order_status NOT NULL DEFAULT 'pending',
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add current_order_id to restaurant_tables after orders exists
ALTER TABLE public.restaurant_tables ADD COLUMN current_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.menu_item_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status public.kot_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Categories RLS policies
CREATE POLICY "All staff can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners and managers can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can update categories" ON public.categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can delete categories" ON public.categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Menu items RLS policies
CREATE POLICY "All staff can view menu items" ON public.menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners and managers can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Menu item variants RLS policies
CREATE POLICY "All staff can view variants" ON public.menu_item_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners and managers can insert variants" ON public.menu_item_variants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can update variants" ON public.menu_item_variants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can delete variants" ON public.menu_item_variants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Menu item addons RLS policies
CREATE POLICY "All staff can view addons" ON public.menu_item_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners and managers can insert addons" ON public.menu_item_addons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can update addons" ON public.menu_item_addons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Owners and managers can delete addons" ON public.menu_item_addons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Restaurant tables RLS policies
CREATE POLICY "All staff can view tables" ON public.restaurant_tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners and managers can insert tables" ON public.restaurant_tables FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff can update tables" ON public.restaurant_tables FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter'));
CREATE POLICY "Owners and managers can delete tables" ON public.restaurant_tables FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Customers RLS policies
CREATE POLICY "All staff can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'cashier'));
CREATE POLICY "Staff can update customers" ON public.customers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'cashier'));
CREATE POLICY "Owners and managers can delete customers" ON public.customers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Orders RLS policies
CREATE POLICY "All staff can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'cashier'));
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'cashier') OR has_role(auth.uid(), 'kitchen'));
CREATE POLICY "Owners and managers can delete orders" ON public.orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Order items RLS policies
CREATE POLICY "All staff can view order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'cashier'));
CREATE POLICY "Staff can update order items" ON public.order_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'kitchen'));
CREATE POLICY "Owners and managers can delete order items" ON public.order_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Reservations RLS policies
CREATE POLICY "All staff can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter'));
CREATE POLICY "Staff can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'waiter'));
CREATE POLICY "Owners and managers can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

-- Create updated_at triggers for all tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;

-- Create indexes for performance
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_table ON public.orders(table_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);
CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX idx_customers_phone ON public.customers(phone);
