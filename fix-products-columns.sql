-- Fix missing columns in products table
-- Run this in your Supabase SQL Editor

-- Add is_active column if it doesn't exist
DO $$
BEGIN
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
END $$;

-- Add is_featured column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_featured'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_featured column to products table';
    END IF;
END $$;

-- Add inventory_count column if it doesn't exist
DO $$
BEGIN
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
END $$;

-- Add category column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'General';
        RAISE NOTICE 'Added category column to products table';
    END IF;
END $$;

-- Add images column if it doesn't exist
DO $$
BEGIN
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
END $$;

-- Add vendor_id column if it doesn't exist
DO $$
BEGIN
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

-- Update existing products to have default values
UPDATE products SET 
    is_active = COALESCE(is_active, TRUE),
    is_featured = COALESCE(is_featured, FALSE),
    inventory_count = COALESCE(inventory_count, 50),
    category = COALESCE(category, 'General'),
    images = COALESCE(images, ARRAY['/images/placeholder-product.svg'])
WHERE is_active IS NULL OR is_featured IS NULL OR inventory_count IS NULL OR category IS NULL OR images IS NULL;

-- Enable RLS if not enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products (drop existing if they exist)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;

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

CREATE POLICY "Vendors can delete own products" ON products 
FOR DELETE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Insert sample data if table is empty
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) VALUES
  (gen_random_uuid(), 'Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life', 299.99, 'Electronics', ARRAY['/images/placeholder-product.svg'], 50, true, true),
  (gen_random_uuid(), 'Organic Coffee Beans', 'Premium arabica coffee beans from Colombia, medium roast', 24.99, 'Food', ARRAY['/images/placeholder-product.svg'], 100, true, true),
  (gen_random_uuid(), 'Yoga Mat', 'Eco-friendly non-slip yoga mat with carrying strap', 39.99, 'Sports', ARRAY['/images/placeholder-product.svg'], 75, true, false),
  (gen_random_uuid(), 'Smart Watch', 'Fitness tracker with heart rate monitor and GPS', 199.99, 'Electronics', ARRAY['/images/placeholder-product.svg'], 30, true, true),
  (gen_random_uuid(), 'Running Shoes', 'Lightweight breathable running shoes with cushioned sole', 89.99, 'Sports', ARRAY['/images/placeholder-product.svg'], 60, true, false)
ON CONFLICT DO NOTHING;

-- Verify the fix
SELECT 
    id, 
    name, 
    category, 
    price, 
    inventory_count,
    is_active,
    images,
    created_at
FROM products 
ORDER BY created_at DESC
LIMIT 5;
