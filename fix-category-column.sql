-- Fix missing category column in products table
-- Run this in your Supabase SQL Editor

-- First check if the column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing category column
        ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Uncategorized';
        RAISE NOTICE 'Added category column to products table';
    ELSE
        RAISE NOTICE 'Category column already exists in products table';
    END IF;
END $$;

-- Update existing products to have proper categories
UPDATE products SET category = 'Electronics' WHERE name ILIKE '%headphone%' OR name ILIKE '%watch%';
UPDATE products SET category = 'Food' WHERE name ILIKE '%coffee%';
UPDATE products SET category = 'Sports' WHERE name ILIKE '%yoga%' OR name ILIKE '%shoe%';

-- Verify the fix
SELECT 
    id, 
    name, 
    category, 
    price, 
    is_active 
FROM products 
ORDER BY created_at DESC;
