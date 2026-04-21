-- QUICK FIX for PostgREST Schema Cache Issue
-- Run this in Supabase SQL Editor immediately

-- Step 1: Ensure customer_id column exists (this should succeed silently if it already exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- Step 2: Force PostgREST to reload the schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name = 'customer_id';

-- Step 4: Test the orders table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected output should show customer_id column in the orders table
-- After running this, wait 30-60 seconds for the schema cache to refresh
-- Then try the checkout again
