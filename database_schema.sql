-- Complete database schema for Num1Store
-- Run this in Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  store_logo TEXT,
  business_license TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (updated to match TypeScript interface)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  inventory_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (ensure auth operations work)
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable delete for users" ON profiles FOR DELETE USING (auth.uid() = id);

-- Create policies for vendors
CREATE POLICY "Vendors can view own vendor info" ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors can update own vendor info" ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can insert own vendor info" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for categories (public read access for active categories)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);

-- Create policies for products (allow public reads for active products)
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors can view own products" ON products FOR SELECT USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));
CREATE POLICY "Vendors can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));
CREATE POLICY "Vendors can update own products" ON products FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));
CREATE POLICY "Vendors can delete own products" ON products FOR DELETE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Create policies for orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM vendors WHERE is_approved = TRUE)
);

-- Create policies for order_items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);
CREATE POLICY "Users can create own order items" ON order_items FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security for new tables
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies for cart
CREATE POLICY "Users can view own cart" ON cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON cart FOR DELETE USING (auth.uid() = user_id);

-- Create policies for wishlist
CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- Insert sample data for testing (only if tables are empty)
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) VALUES
  (gen_random_uuid(), 'Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life', 299.99, 'Electronics', ARRAY['/images/headphones1.jpg', '/images/headphones2.jpg'], 50, true, true),
  (gen_random_uuid(), 'Organic Coffee Beans', 'Premium arabica coffee beans from Colombia, medium roast', 24.99, 'Food', ARRAY['/images/coffee1.jpg'], 100, true, true),
  (gen_random_uuid(), 'Yoga Mat', 'Eco-friendly non-slip yoga mat with carrying strap', 39.99, 'Sports', ARRAY['/images/yogamat1.jpg', '/images/yogamat2.jpg'], 75, true, false),
  (gen_random_uuid(), 'Smart Watch', 'Fitness tracker with heart rate monitor and GPS', 199.99, 'Electronics', ARRAY['/images/watch1.jpg', '/images/watch2.jpg'], 30, true, true),
  (gen_random_uuid(), 'Running Shoes', 'Lightweight breathable running shoes with cushioned sole', 89.99, 'Sports', ARRAY['/images/shoes1.jpg', '/images/shoes2.jpg'], 60, true, false)
ON CONFLICT DO NOTHING;
