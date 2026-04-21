-- Quick fix for product RLS policies
-- Run this in Supabase SQL Editor immediately

-- Drop the problematic update policy
DROP POLICY IF EXISTS "Vendors can update their own products" ON products;

-- Recreate with correct vendor relationship check
CREATE POLICY "Vendors can update their own products" ON products
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors 
            WHERE vendors.user_id = auth.uid()
        )
    );

-- Also fix the delete policy
DROP POLICY IF EXISTS "Vendors can delete their own products" ON products;

CREATE POLICY "Vendors can delete their own products" ON products
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND vendor_id IN (
            SELECT id FROM vendors 
            WHERE vendors.user_id = auth.uid()
        )
    );

-- Verify the fix
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products' AND cmd IN ('UPDATE', 'DELETE');
