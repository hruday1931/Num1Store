-- Fix missing updated_at column in vendors table
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. Add missing updated_at column
-- ===========================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ===========================================
-- 2. Add phone_number column if it doesn't exist
-- ===========================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- ===========================================
-- 3. Verify columns were added
-- ===========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name IN ('updated_at', 'phone_number')
ORDER BY column_name;

-- ===========================================
-- 4. Refresh schema cache
-- ===========================================
-- This helps PostgREST recognize the new columns
NOTIFY pgrst, 'reload schema';

-- ===========================================
-- 5. Create trigger for automatic updated_at (optional)
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

-- ===========================================
-- 6. Test query to verify the fix
-- ===========================================
-- This should work without errors after the fix
SELECT id, user_id, store_name, phone_number, updated_at
FROM vendors 
WHERE user_id = auth.uid()
LIMIT 1;
