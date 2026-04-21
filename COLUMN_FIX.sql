-- FIX FOR CUSTOMER_ID COLUMN ERROR
-- Run this in Supabase SQL Editor immediately

-- Step 1: Ensure customer_id column exists in orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- Step 2: Ensure all required columns exist in orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL DEFAULT '';

-- Step 3: Ensure order_items table has correct columns
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Step 4: Force PostgREST to reload the schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify the orders table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 6: Test with a simple insert (remove this after verification)
-- This test should work after the schema cache refresh
-- DELETE FROM orders WHERE id = '00000000-0000-0000-0000-000000000000';
-- INSERT INTO orders (id, customer_id, total_amount, status, shipping_address) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 0.00, 'pending', 'test address');

-- Expected output should show:
-- - customer_id column with UUID type
-- - total_amount column with DECIMAL type
-- - status column with TEXT type  
-- - shipping_address column with TEXT type

-- After running this, wait 30-60 seconds for the schema cache to refresh
-- Then restart your development server and try checkout again
