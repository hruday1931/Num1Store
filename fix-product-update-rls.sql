-- Fix Product Update RLS Issue
-- Run this in your Supabase SQL Editor

-- Drop existing product policies that might be causing issues
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Vendors can insert their own products" ON products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Create corrected policies

-- Allow anyone to view active products
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Allow vendors to view their own products (including inactive ones)
CREATE POLICY "Vendors can view own products" ON products 
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- Allow vendors to insert their own products
CREATE POLICY "Vendors can insert own products" ON products 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- Allow vendors to update their own products
CREATE POLICY "Vendors can update own products" ON products 
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- Allow vendors to delete their own products
CREATE POLICY "Vendors can delete own products" ON products 
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

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
WHERE tablename = 'products'
ORDER BY policyname;

-- Test the policy (run this while logged in as a vendor)
SELECT 
    'Current user can update products' as test_result,
    COUNT(*) as product_count
FROM products 
WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid());
