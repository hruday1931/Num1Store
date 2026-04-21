-- QUICK FIX FOR PRODUCTS TABLE
-- Run this in your Supabase SQL Editor to fix the database structure

-- First, drop the existing products table if it has wrong structure
DROP TABLE IF EXISTS products CASCADE;

-- Create the products table with correct structure
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  inventory_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active products
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Create policies for vendors (for future use)
CREATE POLICY "Vendors can view own products" ON products FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can insert own products" ON products FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can update own products" ON products FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can delete own products" ON products FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Insert sample data (using a dummy vendor_id for now)
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life', 299.99, 'Electronics', ARRAY['/images/headphones1.jpg', '/images/headphones2.jpg'], 50, true),
  ('00000000-0000-0000-0000-000000000000', 'Organic Coffee Beans', 'Premium arabica coffee beans from Colombia, medium roast', 24.99, 'Food', ARRAY['/images/coffee1.jpg'], 100, true),
  ('00000000-0000-0000-0000-000000000000', 'Yoga Mat', 'Eco-friendly non-slip yoga mat with carrying strap', 39.99, 'Sports', ARRAY['/images/yogamat1.jpg', '/images/yogamat2.jpg'], 75, true),
  ('00000000-0000-0000-0000-000000000000', 'Smart Watch', 'Fitness tracker with heart rate monitor and GPS', 199.99, 'Electronics', ARRAY['/images/watch1.jpg', '/images/watch2.jpg'], 30, true),
  ('00000000-0000-0000-0000-000000000000', 'Running Shoes', 'Lightweight breathable running shoes with cushioned sole', 89.99, 'Sports', ARRAY['/images/shoes1.jpg', '/images/shoes2.jpg'], 60, true);

-- Create indexes for better performance
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
