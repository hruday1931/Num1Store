-- Refresh PostgREST schema cache and verify products table
-- Run this in Supabase SQL Editor to fix PGRST204 errors

-- Step 1: Verify the products table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if inventory_count column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'inventory_count'
AND table_schema = 'public';

-- Step 3: Add inventory_count column if it doesn't exist (for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'inventory_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added inventory_count column to products table';
    ELSE
        RAISE NOTICE 'inventory_count column already exists';
    END IF;
END $$;

-- Step 4: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Wait a moment and verify the cache is refreshed
-- (This might take a few seconds to take effect)
SELECT 'Schema cache refresh requested' as status;

-- Step 6: Test with a simple select to verify the column is accessible
SELECT 
    id,
    name,
    inventory_count,
    price,
    category
FROM products 
LIMIT 1;
