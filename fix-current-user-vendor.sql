-- Fix current user as vendor
-- This script creates or updates a vendor record for the currently authenticated user

DO $$
BEGIN
    INSERT INTO public.vendors (id, user_id, store_name, updated_at, created_at)
    VALUES (
        auth.uid(), 
        auth.uid(), 
        'My Store', 
        NOW(), 
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET user_id = EXCLUDED.id,
        store_name = EXCLUDED.store_name,
        updated_at = NOW();
END $$;

-- Verify the vendor was created/updated
SELECT 
    id,
    user_id,
    store_name,
    is_approved,
    created_at,
    updated_at
FROM vendors 
WHERE user_id = auth.uid();
