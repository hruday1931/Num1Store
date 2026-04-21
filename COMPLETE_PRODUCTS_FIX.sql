-- COMPLETE PRODUCTS TABLE FIX
-- Run this entire script in your Supabase SQL Editor
-- This will fix the schema, add sample data, and set up proper policies

-- Step 1: Drop existing table and recreate with proper schema
DROP TABLE IF EXISTS products CASCADE;

-- Step 2: Recreate products table with all required columns
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  images TEXT[] DEFAULT '{}',
  inventory_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;

-- Allow anyone to view active products
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Allow vendors to manage their own products
CREATE POLICY "Vendors can view own products" ON products 
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can insert own products" ON products 
FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can update own products" ON products 
FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can delete own products" ON products 
FOR DELETE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Step 6: Insert sample products (using a placeholder vendor_id)
-- First, let's check if we have any vendors, if not, create one
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vendors LIMIT 1) THEN
        INSERT INTO vendors (user_id, store_name, store_description, is_approved)
        VALUES (
            gen_random_uuid(), 
            'Sample Store', 
            'A sample store for demonstration purposes', 
            true
        );
        RAISE NOTICE 'Created sample vendor';
    END IF;
END $$;

-- Now insert sample products
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) 
SELECT 
    v.id,
    'Wireless Headphones',
    'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.',
    299.99,
    'Electronics',
    ARRAY['/images/placeholder-product.svg'],
    50,
    true,
    true
FROM vendors v 
LIMIT 1;

INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) 
SELECT 
    v.id,
    'Organic Coffee Beans',
    'Premium arabica coffee beans from Colombia, medium roast with rich chocolate notes.',
    24.99,
    'Food',
    ARRAY['/images/placeholder-product.svg'],
    100,
    true,
    true
FROM vendors v 
LIMIT 1;

INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) 
SELECT 
    v.id,
    'Yoga Mat',
    'Eco-friendly non-slip yoga mat with carrying strap. Perfect for all yoga practices.',
    39.99,
    'Sports',
    ARRAY['/images/placeholder-product.svg'],
    75,
    true,
    false
FROM vendors v 
LIMIT 1;

INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) 
SELECT 
    v.id,
    'Smart Watch',
    'Advanced fitness tracker with heart rate monitor, GPS, and 7-day battery life.',
    199.99,
    'Electronics',
    ARRAY['/images/placeholder-product.svg'],
    30,
    true,
    true
FROM vendors v 
LIMIT 1;

INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) 
SELECT 
    v.id,
    'Running Shoes',
    'Lightweight breathable running shoes with cushioned sole and excellent arch support.',
    89.99,
    'Sports',
    ARRAY['/images/placeholder-product.svg'],
    60,
    true,
    false
FROM vendors v 
LIMIT 1;

-- Step 7: Verify the setup
SELECT 
    id,
    name,
    category,
    price,
    inventory_count,
    is_active,
    is_featured,
    created_at
FROM products 
ORDER BY created_at DESC;

-- Step 8: Show table info
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 9: Show RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'products';
