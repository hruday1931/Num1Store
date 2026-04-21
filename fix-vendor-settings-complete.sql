-- Complete fix for vendor settings issues
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. Add missing phone_number column
-- ===========================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- ===========================================
-- 2. Ensure all required columns exist
-- ===========================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ===========================================
-- 3. Drop and recreate RLS policies cleanly
-- ===========================================
DROP POLICY IF EXISTS "Vendors can view own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert own vendor info" ON vendors;
DROP POLICY IF EXISTS "Public can view vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;

-- Create proper RLS policies
CREATE POLICY "Vendors can insert own vendor info" ON vendors
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can view own vendor info" ON vendors
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update own vendor info" ON vendors
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view approved vendors" ON vendors
FOR SELECT USING (is_approved = true);

-- ===========================================
-- 4. Verification queries
-- ===========================================

-- Check if phone_number column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'phone_number';

-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Test if current user can update their vendor record
-- (This should return your vendor record if you have one)
SELECT id, user_id, store_name, phone_number, updated_at
FROM vendors 
WHERE user_id = auth.uid();

-- ===========================================
-- 5. Create index for better performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_vendors_phone_number ON vendors(phone_number);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);

-- ===========================================
-- 6. Update trigger for updated_at (optional)
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
