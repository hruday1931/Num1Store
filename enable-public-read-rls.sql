-- SQL commands to enable RLS policies for public read access
-- Run these commands in your Supabase SQL Editor

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

-- Create policies for categories (public read access for active categories)
CREATE POLICY "Anyone can view active categories" ON categories 
FOR SELECT USING (is_active = true);

-- Create policies for products (allow public reads for active products)
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Additional: Ensure RLS is enabled on these tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Optional: Add policies for vendors table (public read access for approved vendors)
DROP POLICY IF EXISTS "Anyone can view approved vendors" ON vendors;
CREATE POLICY "Anyone can view approved vendors" ON vendors 
FOR SELECT USING (is_approved = true);

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
