-- Fix database schema issues
-- Run these commands in your Supabase SQL Editor

-- First, add missing columns if they don't exist
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Make sure products table has all required columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Enable Row Level Security if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Anyone can view approved vendors" ON vendors;

-- Create proper policies for categories
CREATE POLICY "Anyone can view categories" ON categories 
FOR SELECT USING (true);

-- Create proper policies for products
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Create policy for vendors
CREATE POLICY "Anyone can view approved vendors" ON vendors 
FOR SELECT USING (is_approved = true);

-- Insert some sample categories if the table is empty
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
  ('Electronics', 'electronics', 'Electronic devices and gadgets', true, 1),
  ('Clothing', 'clothing', 'Fashion and apparel', true, 2),
  ('Food', 'food', 'Food and beverages', true, 3),
  ('Sports', 'sports', 'Sports and fitness equipment', true, 4),
  ('Home', 'home', 'Home and garden items', true, 5)
ON CONFLICT (name) DO NOTHING;

-- Verify the tables and columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('categories', 'products') 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verify policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('categories', 'products', 'vendors')
ORDER BY tablename, policyname;
