-- Debug script to check cart table and data
-- Run this in Supabase SQL Editor

-- 1. Check if cart table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cart' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerlspolicy
FROM pg_tables 
WHERE tablename = 'cart';

-- 3. Check RLS policies
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
WHERE tablename = 'cart';

-- 4. Count all cart items
SELECT COUNT(*) as total_cart_items FROM cart;

-- 5. Show all cart items (for debugging - remove sensitive data in production)
SELECT 
    id,
    user_id,
    product_id,
    quantity,
    created_at,
    updated_at
FROM cart 
ORDER BY created_at DESC;

-- 6. Check for any cart items with null user_id
SELECT 
    COUNT(*) as null_user_items,
    id,
    product_id,
    quantity,
    created_at
FROM cart 
WHERE user_id IS NULL;

-- 7. Check for duplicate cart items (same user_id and product_id)
SELECT 
    user_id,
    product_id,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as item_ids
FROM cart 
GROUP BY user_id, product_id 
HAVING COUNT(*) > 1;

-- 8. Test RLS policy with current user (if logged in)
-- This will show what the current user can see
SELECT 
    'Current user view' as query_type,
    COUNT(*) as visible_items,
    auth.uid() as current_user_id
FROM cart;

-- 9. Check if there are any users in auth.users
SELECT 
    COUNT(*) as total_auth_users,
    MIN(created_at) as earliest_user,
    MAX(created_at) as latest_user
FROM auth.users;

-- 10. Check cart items by user (grouped)
SELECT 
    user_id,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity,
    MIN(created_at) as first_item_added,
    MAX(created_at) as last_item_added
FROM cart 
GROUP BY user_id 
ORDER BY item_count DESC;
