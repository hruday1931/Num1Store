-- Fix for vendor status columns in profiles table
-- Run this in Supabase SQL Editor to fix the console error

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Verify the columns were added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_vendor', 'subscription_status');
