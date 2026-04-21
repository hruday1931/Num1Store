-- Add Foreign Key Constraint and RLS Policies for Vendors Table
-- Run this in Supabase SQL Editor

-- ===========================================
-- FOREIGN KEY CONSTRAINT: Link vendors.user_id to auth.users(id)
-- ===========================================
-- Note: This assumes the user_id column already exists in vendors table
-- If it doesn't exist, you would need: ALTER TABLE vendors ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE vendors 
ADD CONSTRAINT vendors_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- RLS POLICIES for Vendors Table
-- ===========================================

-- Enable RLS on vendors table (if not already enabled)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Vendors can view own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert own vendor info" ON vendors;
DROP POLICY IF EXISTS "Public can view vendors" ON vendors;

-- Create RLS Policies
-- 1. INSERT: Only authenticated users can create their own vendor record
CREATE POLICY "Vendors can insert own vendor info" ON vendors
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. SELECT: Public access to view vendor information
CREATE POLICY "Public can view vendors" ON vendors
FOR SELECT
USING (true);

-- 3. UPDATE: Only vendors can update their own info
CREATE POLICY "Vendors can update own vendor info" ON vendors
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Only vendors can delete their own info (optional)
CREATE POLICY "Vendors can delete own vendor info" ON vendors
FOR DELETE
USING (auth.uid() = user_id);

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check foreign key constraint
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'vendors' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Check RLS policies
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
WHERE tablename = 'vendors'
ORDER BY policyname;
