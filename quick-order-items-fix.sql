-- Quick Fix for Order Items RLS Issue
-- This creates a simple policy that allows authenticated users to access order_items

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
DROP POLICY IF EXISTS "Vendors can view order items for their products" ON order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable update for order owners" ON order_items;
DROP POLICY IF EXISTS "Enable delete for order owners" ON order_items;

-- Create simple permissive policy for authenticated users
CREATE POLICY "Allow authenticated users to access order_items" ON order_items 
FOR ALL USING (auth.role() = 'authenticated');

-- Verify the policy was created
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'order_items';
