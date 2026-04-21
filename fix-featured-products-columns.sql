-- Fix missing columns for featured products functionality
-- Run this script in your Supabase SQL editor

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to products table';
    ELSE
        RAISE NOTICE 'is_active column already exists in products table';
    END IF;
END $$;

-- Add is_featured column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_featured column to products table';
    ELSE
        RAISE NOTICE 'is_featured column already exists in products table';
    END IF;
END $$;

-- Add inventory_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'inventory_count'
    ) THEN
        ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added inventory_count column to products table';
    ELSE
        RAISE NOTICE 'inventory_count column already exists in products table';
    END IF;
END $$;

-- Add rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE products ADD COLUMN rating DECIMAL(3,2);
        RAISE NOTICE 'Added rating column to products table';
    ELSE
        RAISE NOTICE 'rating column already exists in products table';
    END IF;
END $$;

-- Add images column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images JSONB DEFAULT '["/images/placeholder-product.svg"]'::jsonb;
        RAISE NOTICE 'Added images column to products table';
    ELSE
        RAISE NOTICE 'images column already exists in products table';
    END IF;
END $$;

-- Update some sample products to be featured for testing
UPDATE products 
SET is_featured = true 
WHERE is_featured = false 
LIMIT 5;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
