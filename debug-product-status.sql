-- Debug script to check product status update permissions
-- Run this in Supabase SQL Editor to verify RLS policies

-- Check current RLS policies for products
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'products';

-- Test if a vendor can update their own products
-- Replace 'YOUR_USER_ID' with an actual user ID from your auth.users table
DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID'; -- Replace with actual user ID
    test_vendor_id UUID;
    test_product_id UUID;
    update_result TEXT;
BEGIN
    -- Get vendor ID for the test user
    SELECT id INTO test_vendor_id 
    FROM vendors 
    WHERE user_id = test_user_id;
    
    IF test_vendor_id IS NULL THEN
        RAISE NOTICE 'No vendor found for user ID: %', test_user_id;
        RETURN;
    END IF;
    
    -- Get a product ID for this vendor
    SELECT id INTO test_product_id 
    FROM products 
    WHERE vendor_id = test_vendor_id 
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE 'No products found for vendor: %', test_vendor_id;
        RETURN;
    END IF;
    
    -- Test the update operation
    UPDATE products 
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = test_product_id;
    
    GET DIAGNOSTICS update_result = ROW_COUNT;
    
    RAISE NOTICE 'Update successful! Rows affected: %', update_result;
    
    -- Revert the change
    UPDATE products 
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = test_product_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Update failed: %', SQLERRM;
END $$;

-- Check if there are any blocking RLS policies
SELECT 
    'products' as table_name,
    'UPDATE' as operation,
    count(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'products' AND cmd = 'UPDATE';
