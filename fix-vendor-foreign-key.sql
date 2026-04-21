-- Fix foreign key constraint violation for products table
-- This script removes invalid sample data and ensures proper vendor relationships

-- First, remove any products that have invalid vendor_id values
DELETE FROM products WHERE vendor_id NOT IN (SELECT id FROM vendors);

-- Check if there are any vendors, if not create a sample one
DO $$
DECLARE
    vendor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vendor_count FROM vendors;
    
    IF vendor_count = 0 THEN
        -- Create a sample vendor for testing
        INSERT INTO vendors (user_id, store_name, store_description, is_approved)
        VALUES (
            gen_random_uuid(), -- This will be a placeholder user_id
            'Sample Store',
            'A sample vendor store for testing purposes',
            TRUE
        );
    END IF;
END $$;

-- Now create proper sample products with valid vendor_id
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    v.id,
    'Wireless Headphones',
    'Premium noise-cancelling wireless headphones with 30-hour battery life',
    299.99,
    'Electronics',
    ARRAY['/images/headphones1.jpg', '/images/headphones2.jpg'],
    50,
    true,
    true
FROM vendors v 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    v.id,
    'Organic Coffee Beans',
    'Premium arabica coffee beans from Colombia, medium roast',
    24.99,
    'Food',
    ARRAY['/images/coffee1.jpg'],
    100,
    true,
    true
FROM vendors v 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured)
SELECT 
    v.id,
    'Yoga Mat',
    'Eco-friendly non-slip yoga mat with carrying strap',
    39.99,
    'Sports',
    ARRAY['/images/yogamat1.jpg', '/images/yogamat2.jpg'],
    75,
    true,
    false
FROM vendors v 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify the fix
SELECT 
    p.id,
    p.name,
    p.vendor_id,
    v.store_name,
    v.user_id
FROM products p
JOIN vendors v ON p.vendor_id = v.id
LIMIT 5;
