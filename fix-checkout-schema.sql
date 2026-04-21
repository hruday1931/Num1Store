-- Fix checkout schema issues
-- Run this in Supabase SQL Editor to fix the schema cache problems

-- ===========================================
-- FIX 1: Ensure profiles table has correct columns
-- ===========================================

-- Add missing columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ===========================================
-- FIX 2: Ensure orders table has correct columns  
-- ===========================================

-- Add missing columns to orders table if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL DEFAULT '';

-- ===========================================
-- FIX 3: Ensure order_items table has correct columns
-- ===========================================

-- Add missing columns to order_items table if they don't exist
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ===========================================
-- FIX 4: Refresh schema cache
-- ===========================================

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- ===========================================
-- FIX 5: Recreate RLS policies for orders and order_items
-- ===========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;

-- Create policies for orders
CREATE POLICY "Users can view own orders" ON orders 
FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own orders" ON orders 
FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own orders" ON orders 
FOR UPDATE USING (auth.uid() = customer_id);

-- Create policies for order_items
CREATE POLICY "Users can view own order items" ON order_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can create own order items" ON order_items 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check orders table structure  
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check order_items table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'profiles')
ORDER BY tablename, policyname;
