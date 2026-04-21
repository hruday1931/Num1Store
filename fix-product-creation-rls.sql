-- Fix for product creation RLS policy violation
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing products policies to avoid conflicts
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
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for vendors" ON products;
DROP POLICY IF EXISTS "Enable update for vendors" ON products;
DROP POLICY IF EXISTS "Enable delete for vendors" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view all their products" ON products;
DROP POLICY IF EXISTS "Vendors can insert products" ON products;
DROP POLICY IF EXISTS "Vendors can update their products" ON products;
DROP POLICY IF EXISTS "Vendors can delete their products" ON products;

-- Step 2: Create corrected RLS policies that work with the actual setup

-- Policy 1: Public read access for active products
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Policy 2: Vendors can view all their products (including inactive ones)
CREATE POLICY "Vendors can view their products" ON products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

-- Policy 3: Vendors can insert products (simplified check)
CREATE POLICY "Vendors can insert products" ON products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

-- Policy 4: Vendors can update their own products
CREATE POLICY "Vendors can update their products" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

-- Policy 5: Vendors can delete their own products
CREATE POLICY "Vendors can delete their products" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

-- Step 3: Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 4: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify the policies are correctly created
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY cmd, policyname;

-- Step 6: Test the current user's vendor access (run this to debug)
-- Uncomment the following lines to test your specific user:
-- SELECT 
--     u.id as user_id,
--     v.id as vendor_id,
--     v.user_id as vendor_user_id,
--     p.is_vendor,
--     p.subscription_status
-- FROM auth.users u
-- LEFT JOIN vendors v ON v.user_id = u.id
-- LEFT JOIN profiles p ON p.id = u.id
-- WHERE u.id = auth.uid();
