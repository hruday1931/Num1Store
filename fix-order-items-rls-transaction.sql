-- Fix Order Items RLS for Transaction-based Order Creation
-- This policy allows order_items insertion when creating an order

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
DROP POLICY IF EXISTS "Vendors can view order items for their products" ON order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable update for order owners" ON order_items;
DROP POLICY IF EXISTS "Enable delete for order owners" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
DROP POLICY IF EXISTS "Customers can create own order items" ON order_items;

-- Create new policies for order_items
-- 1. Customers can view their own order items
CREATE POLICY "Customers can view own order items" ON order_items 
FOR SELECT USING (
  auth.uid() IN (
    SELECT customer_id 
    FROM orders 
    WHERE orders.id = order_items.order_id
  )
);

-- 2. Customers can create order items (for checkout process)
-- This policy allows insertion when the order belongs to the authenticated user
CREATE POLICY "Customers can create own order items" ON order_items 
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT customer_id 
    FROM orders 
    WHERE orders.id = order_items.order_id
  )
);

-- 3. Vendors can view order items for their products
CREATE POLICY "Vendors can view order items for their products" ON order_items 
FOR SELECT USING (
  auth.uid() IN (
    SELECT vendor_id 
    FROM products 
    WHERE products.id = order_items.product_id
  )
);

-- 4. Admin can do everything (if you have admin role)
CREATE POLICY "Admins can manage all order items" ON order_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'order_items' 
ORDER BY policyname;
