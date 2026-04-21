-- Fix Row Level Security Policies for Products Table
-- Run this script in your Supabase SQL editor

-- First, ensure RLS is enabled on the products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Create policy for viewing products (all authenticated users can view)
CREATE POLICY "Users can view all products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for vendors to insert their own products
CREATE POLICY "Vendors can insert their own products" ON products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_vendor = true 
            AND profiles.subscription_status = 'active'
        )
        AND vendor_id = auth.uid()
    );

-- Create policy for vendors to update their own products
CREATE POLICY "Vendors can update their own products" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND vendor_id = auth.uid()
    );

-- Create policy for vendors to delete their own products
CREATE POLICY "Vendors can delete their own products" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND vendor_id = auth.uid()
    );

-- Create policy for admins to manage all products (if you have admin role)
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Verify the policies were created
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

-- Show current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerlspolicy
FROM pg_tables 
WHERE tablename = 'products';

-- Test the policy by checking current user's vendor status
-- (Run this while logged in as a vendor user)
SELECT 
    p.id,
    p.is_vendor,
    p.subscription_status,
    COUNT(pr.id) as product_count
FROM profiles p
LEFT JOIN products pr ON p.id = pr.vendor_id
WHERE p.id = auth.uid()
GROUP BY p.id, p.is_vendor, p.subscription_status;
