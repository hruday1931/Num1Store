-- Fix StorageApiError: Row Level Security Policy Violation
-- This script fixes the RLS policies to match the actual database schema

-- Step 1: Ensure profiles table has the required columns for RLS policies
DO $$
BEGIN
    -- Add is_vendor column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_vendor'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_vendor BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_vendor column to profiles table';
    END IF;
    
    -- Add subscription_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));
        RAISE NOTICE 'Added subscription_status column to profiles table';
    END IF;
    
    -- Add is_admin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_admin'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_admin column to profiles table';
    END IF;
END $$;

-- Step 2: Update existing profiles to have proper vendor status
-- This assumes existing users might be vendors - adjust as needed
UPDATE profiles 
SET is_vendor = TRUE, subscription_status = 'active'
WHERE id IN (SELECT user_id FROM vendors);

-- Step 3: Drop all existing product RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;

-- Step 4: Create corrected RLS policies that match the actual schema

-- Policy for viewing products (public for active products, vendors can see all their products)
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can view all their products" ON products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.user_id = auth.uid() 
            AND vendors.id = products.vendor_id
        )
    );

-- Policy for inserting products (only vendors with active subscriptions)
CREATE POLICY "Vendors can insert products" ON products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_vendor = true 
            AND profiles.subscription_status = 'active'
        )
        AND vendor_id IN (
            SELECT id FROM vendors 
            WHERE vendors.user_id = auth.uid()
        )
    );

-- Policy for updating products (vendors can update their own products)
CREATE POLICY "Vendors can update their products" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.user_id = auth.uid() 
            AND vendors.id = products.vendor_id
        )
    );

-- Policy for deleting products (vendors can delete their own products)
CREATE POLICY "Vendors can delete their products" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.user_id = auth.uid() 
            AND vendors.id = products.vendor_id
        )
    );

-- Policy for admins (if any admin users exist)
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Step 5: Ensure proper permissions
GRANT ALL ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify the policies were created correctly
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
WHERE tablename = 'products'
ORDER BY policyname;

-- Step 8: Test current user's access
-- This shows what the current user can access
SELECT 
    'Current User Profile' as info,
    p.id,
    p.is_vendor,
    p.subscription_status,
    p.is_admin
FROM profiles p
WHERE p.id = auth.uid()

UNION ALL

SELECT 
    'Current User Vendor Info' as info,
    v.id,
    v.user_id,
    v.store_name,
    v.is_approved
FROM vendors v
WHERE v.user_id = auth.uid()

UNION ALL

SELECT 
    'Products You Can Access' as info,
    COUNT(*)::text as count,
    'products' as type,
    '' as extra
FROM products 
WHERE (
    is_active = true 
    OR (
        auth.role() = 'authenticated' 
        AND vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
);
