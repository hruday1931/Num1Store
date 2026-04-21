-- Migration script to fix vendors table schema
-- Run this in Supabase SQL Editor to ensure all required columns exist

-- Add missing columns to vendors table if they don't exist
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS store_description TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS store_logo TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS business_license TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Add the is_subscribed column if referenced in the code
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- Ensure user_id has proper foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendors_user_id_fkey' 
        AND table_name = 'vendors'
    ) THEN
        ALTER TABLE vendors 
        ADD CONSTRAINT vendors_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create or update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_approved ON vendors(is_approved);
CREATE INDEX IF NOT EXISTS idx_vendors_is_subscribed ON vendors(is_subscribed);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Vendors can view own vendor info" ON vendors;
CREATE POLICY "Vendors can view own vendor info" ON vendors FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vendors can update own vendor info" ON vendors;
CREATE POLICY "Vendors can update own vendor info" ON vendors FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vendors can insert own vendor info" ON vendors;
CREATE POLICY "Vendors can insert own vendor info" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add policy for admins to view all vendors
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
CREATE POLICY "Admins can view all vendors" ON vendors FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (full_name ILIKE '%admin%' OR email ILIKE '%admin%')
    )
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' 
ORDER BY ordinal_position;
