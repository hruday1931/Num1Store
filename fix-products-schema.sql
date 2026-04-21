-- Complete fix for products table schema
-- Run this in your Supabase SQL Editor

-- Add missing columns to products table
DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Uncategorized';
        RAISE NOTICE 'Added category column to products table';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to products table';
    END IF;
    
    -- Add inventory_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'inventory_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added inventory_count column to products table';
    END IF;
    
    -- Add images column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'images'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added images column to products table';
    END IF;
    
    -- Add vendor_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'vendor_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN vendor_id UUID REFERENCES vendors(id);
        RAISE NOTICE 'Added vendor_id column to products table';
    END IF;
END $$;

-- Update existing products with proper data
UPDATE products SET 
    category = CASE 
        WHEN name ILIKE '%headphone%' OR name ILIKE '%watch%' THEN 'Electronics'
        WHEN name ILIKE '%coffee%' THEN 'Food'
        WHEN name ILIKE '%yoga%' OR name ILIKE '%shoe%' THEN 'Sports'
        ELSE 'Uncategorized'
    END,
    is_active = COALESCE(is_active, TRUE),
    inventory_count = COALESCE(inventory_count, 50);

-- Ensure RLS is enabled and policies are correct
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;

-- Create policies for public read access
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Create policies for vendors
CREATE POLICY "Vendors can view own products" ON products 
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can insert own products" ON products 
FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can update own products" ON products 
FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Verify the fix
SELECT 
    id, 
    name, 
    category, 
    price, 
    inventory_count,
    is_active,
    created_at
FROM products 
ORDER BY created_at DESC;
