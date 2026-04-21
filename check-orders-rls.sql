-- SQL script to check and fix orders table RLS policies
-- Run this in your Supabase SQL Editor

-- Check current RLS status on orders table
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders';

-- Check existing policies on orders table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Enable RLS on orders table if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Create proper RLS policies for orders table
CREATE POLICY "Users can view own orders" ON orders 
FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own orders" ON orders 
FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders" ON orders 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendors 
    WHERE user_id = auth.uid() AND is_approved = TRUE
  )
);

-- Verify the policies were created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Test query (replace with actual user ID to test)
-- SELECT * FROM orders WHERE customer_id = 'your-user-id-here';
