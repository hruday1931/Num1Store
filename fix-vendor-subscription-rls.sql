-- Fix Vendor Subscription RLS Issues
-- Run this in Supabase SQL Editor

-- ===========================================
-- STEP 1: Verify and fix profiles table schema
-- ===========================================

-- Add vendor-related columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));

-- ===========================================
-- STEP 2: Drop existing RLS policies for profiles
-- ===========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users" ON profiles;

-- ===========================================
-- STEP 3: Create proper RLS policies for profiles
-- ===========================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (including vendor subscription fields)
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles 
FOR DELETE USING (auth.uid() = id);

-- ===========================================
-- STEP 4: Fix vendors table RLS policies
-- ===========================================

-- Drop existing vendor policies
DROP POLICY IF EXISTS "Vendors can view own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert own vendor info" ON vendors;
DROP POLICY IF EXISTS "Public can view vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;

-- Create proper vendor policies
CREATE POLICY "Vendors can insert own vendor info" ON vendors 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can view own vendor info" ON vendors 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update own vendor info" ON vendors 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view approved vendors" ON vendors 
FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can view all vendors" ON vendors 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_vendor = true
  )
);

-- ===========================================
-- STEP 5: Verify RLS is enabled
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 6: Test the policies (run these to verify)
-- ===========================================

-- Test 1: Check if current user can read their profile
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Test 2: Check if columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('is_vendor', 'subscription_status');

-- Test 3: Check RLS policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'vendors')
-- ORDER BY tablename, policyname;

-- ===========================================
-- STEP 7: Create helpful indexes for performance
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_profiles_is_vendor ON profiles(is_vendor);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_approved ON vendors(is_approved);

-- ===========================================
-- STEP 8: Add a function to check vendor status
-- ===========================================

CREATE OR REPLACE FUNCTION public.is_vendor(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_vendor = true
  );
$$;

-- ===========================================
-- STEP 9: Grant necessary permissions
-- ===========================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant select on all relevant tables
GRANT SELECT ON profiles TO authenticated, anon;
GRANT SELECT ON vendors TO authenticated, anon;

-- Grant necessary permissions for authenticated users
GRANT INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON vendors TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check if policies are correctly set up
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
WHERE tablename IN ('profiles', 'vendors')
ORDER BY tablename, policyname;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('id', 'is_vendor', 'subscription_status', 'phone')
ORDER BY ordinal_position;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' 
  AND column_name IN ('id', 'user_id', 'store_name', 'is_approved')
ORDER BY ordinal_position;
