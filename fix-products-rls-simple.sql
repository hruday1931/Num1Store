-- Simple fix for products RLS policies
-- Run this in Supabase SQL Editor if the dashboard still has errors

-- Drop existing products policies
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Vendors can insert their own products" ON products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Create simple policies that work better with count queries
CREATE POLICY "Enable read access for all authenticated users" ON products FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for vendors" ON products FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_vendor = true 
    AND profiles.subscription_status = 'active'
  )
);

CREATE POLICY "Enable update for vendors" ON products FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for vendors" ON products FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'products';
