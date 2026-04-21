-- Refresh PostgREST schema cache and ensure profiles table has correct columns
-- Run this in Supabase SQL Editor to fix the PostgREST error

-- First, ensure the profiles table has the required columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- Ensure vendors table has the required columns
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- Refresh PostgREST schema cache to recognize new columns
NOTIFY pgrst, 'reload schema';

-- Wait a moment for the cache to refresh, then verify the schema
-- (You may need to run this SELECT separately after a few seconds)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name IN ('is_vendor', 'subscription_status', 'store_name', 'updated_at')
ORDER BY ordinal_position;
