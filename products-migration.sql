-- Fix products table schema to match TypeScript interface
-- Run this in Supabase SQL Editor

-- First, let's check current table structure
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'products';

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category'
    ) THEN
        ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'General';
    END IF;
    
    -- Add images column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add inventory_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'inventory_count'
    ) THEN
        ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Insert sample products (only if table is empty)
INSERT INTO products (name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    'Wireless Bluetooth Headphones',
    'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.',
    199.99,
    'Electronics',
    ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    50,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO products (name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    'Organic Coffee Beans',
    'Premium arabica coffee beans from high-altitude farms, medium roast with chocolate notes.',
    24.99,
    'Food & Beverages',
    ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
    100,
    true,
    false
WHERE (SELECT COUNT(*) FROM products) = 1;

INSERT INTO products (name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    'Yoga Mat Premium',
    'Extra thick eco-friendly yoga mat with alignment markers and carrying strap.',
    45.99,
    'Sports & Fitness',
    ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
    30,
    true,
    true
WHERE (SELECT COUNT(*) FROM products) = 2;

INSERT INTO products (name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    'Smart Watch Pro',
    'Advanced fitness tracking, heart rate monitoring, and smartphone integration.',
    299.99,
    'Electronics',
    ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
    25,
    true,
    false
WHERE (SELECT COUNT(*) FROM products) = 3;

INSERT INTO products (name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    'Ceramic Plant Pot Set',
    'Set of 3 handmade ceramic plant pots with drainage holes and saucers.',
    34.99,
    'Home & Garden',
    ARRAY['https://images.unsplash.com/photo-1485955900006-10f4d1d966be?w=400'],
    40,
    true,
    false
WHERE (SELECT COUNT(*) FROM products) = 4;

INSERT INTO products (name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    'Leather Wallet',
    'Genuine leather bifold wallet with RFID blocking technology and multiple card slots.',
    59.99,
    'Accessories',
    ARRAY['https://images.unsplash.com/photo-1627123424554-39d2a1e78d4b?w=400'],
    60,
    true,
    true
WHERE (SELECT COUNT(*) FROM products) = 5;

-- Update existing rows to have default values if they were missing
UPDATE products SET 
    is_active = COALESCE(is_active, true),
    is_featured = COALESCE(is_featured, false),
    category = COALESCE(category, 'General'),
    images = COALESCE(images, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400']),
    inventory_count = COALESCE(inventory_count, 0);

-- Show the result
SELECT COUNT(*) as total_products, 
       COUNT(*) FILTER (WHERE is_active = true) as active_products,
       COUNT(*) FILTER (WHERE is_featured = true) as featured_products
FROM products;
