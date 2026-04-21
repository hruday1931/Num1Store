-- Fix profiles table schema to ensure it has the correct columns
-- Run this in Supabase SQL Editor

-- First, check if phone column exists and remove it if it does (to avoid conflicts)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles DROP COLUMN phone;
        RAISE NOTICE 'Dropped phone column from profiles table';
    END IF;
END $$;

-- Add is_vendor and subscription_status columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));

-- Ensure the profiles table has the correct basic structure
-- The phone number should be stored in the vendors table, not profiles

-- Refresh the schema cache (this may help with Supabase caching issues)
NOTIFY pgrst, 'reload schema';

-- Recreate RLS policies for profiles to ensure they're correct
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users" ON profiles;

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable delete for users" ON profiles FOR DELETE USING (auth.uid() = id);

-- Verify the vendors table has phone_number column
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_phone_number ON vendors(phone_number);
CREATE INDEX IF NOT EXISTS idx_vendors_is_subscribed ON vendors(is_subscribed);

-- Show the current structure of profiles table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
