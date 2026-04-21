-- QUICK FIX FOR PRODUCT CREATION RLS ERROR
-- Copy this entire script and paste into your Supabase SQL Editor, then run it

-- Drop all existing product policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;

-- Create corrected policies
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can view their products" ON products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can insert products" ON products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update their products" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete their products" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

-- Verify policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products' ORDER BY policyname;
