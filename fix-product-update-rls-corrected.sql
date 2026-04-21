-- Fix Row Level Security Policies for Products Table - CORRECTED VERSION
-- This fixes the vendor_id = auth.uid() issue

-- Drop existing incorrect policies
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
            SELECT 1 FROM vendors 
            WHERE vendors.user_id = auth.uid()
            AND vendors.is_approved = true
        )
        AND vendor_id IN (
            SELECT id FROM vendors 
            WHERE vendors.user_id = auth.uid()
        )
    );

-- Create policy for vendors to update their own products (FIXED)
CREATE POLICY "Vendors can update their own products" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors 
            WHERE vendors.user_id = auth.uid()
        )
    );

-- Create policy for vendors to delete their own products (FIXED)
CREATE POLICY "Vendors can delete their own products" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors 
            WHERE vendors.user_id = auth.uid()
        )
    );

-- Create policy for admins to manage all products
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

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
