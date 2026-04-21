// Debug script for product update issues
// Run this in your Supabase SQL Editor to check the current state

-- Check if user is authenticated and has vendor record
SELECT 
  auth.uid() as current_user_id,
  v.id as vendor_id,
  v.user_id,
  v.store_name,
  v.is_approved
FROM vendors v 
WHERE v.user_id = auth.uid();

-- Check if the product exists and belongs to the vendor
SELECT 
  p.id as product_id,
  p.name,
  p.vendor_id,
  v.user_id as vendor_user_id,
  CASE 
    WHEN v.user_id = auth.uid() THEN 'OWNED BY USER'
    ELSE 'NOT OWNED BY USER'
  END as ownership_status
FROM products p
JOIN vendors v ON p.vendor_id = v.id
WHERE p.id = 'YOUR_PRODUCT_ID_HERE'; -- Replace with actual product ID

-- Test the RLS policy directly
-- This should work if the policy is correct
SELECT * FROM products 
WHERE id = 'YOUR_PRODUCT_ID_HERE' 
AND auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id);

-- Check current RLS policies
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
