-- Fix Products Integration for Num1Store
-- Run this in Supabase SQL Editor

-- Step 1: Ensure RLS is enabled on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 2: Create/Update RLS policy for public read access
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

-- Create policy for public read access to active products
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Step 3: Clear existing sample data (optional - uncomment if you want to start fresh)
-- DELETE FROM products WHERE name IN (
--   'Wireless Headphones', 
--   'Organic Coffee Beans', 
--   'Yoga Mat', 
--   'Smart Watch', 
--   'Running Shoes'
-- );

-- Step 4: Insert sample products with proper vendor references
-- First, let's insert a sample vendor if needed
INSERT INTO vendors (id, user_id, store_name, store_description, is_approved) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  (SELECT id FROM auth.users LIMIT 1), 
  'TechStore Pro', 
  'Your trusted electronics and lifestyle store', 
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert 5 sample products
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Wireless Headphones', 
    'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality. Perfect for music lovers and professionals.', 
    299.99, 
    'Electronics', 
    ARRAY['/images/headphones1.jpg', '/images/headphones2.jpg'], 
    50, 
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Organic Coffee Beans', 
    'Premium arabica coffee beans from Colombia, medium roast with rich chocolate and nutty notes. Ethically sourced and freshly roasted.', 
    24.99, 
    'Food', 
    ARRAY['/images/coffee1.jpg'], 
    100, 
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Yoga Mat', 
    'Eco-friendly non-slip yoga mat with carrying strap. Made from sustainable materials with extra cushioning for comfort.', 
    39.99, 
    'Sports', 
    ARRAY['/images/yogamat1.jpg', '/images/yogamat2.jpg'], 
    75, 
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Smart Watch', 
    'Advanced fitness tracker with heart rate monitor, GPS, and 7-day battery life. Water-resistant with sleep tracking.', 
    199.99, 
    'Electronics', 
    ARRAY['/images/watch1.jpg', '/images/watch2.jpg'], 
    30, 
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Running Shoes', 
    'Lightweight breathable running shoes with cushioned sole and advanced arch support. Perfect for daily training and marathons.', 
    89.99, 
    'Sports', 
    ARRAY['/images/shoes1.jpg', '/images/shoes2.jpg'], 
    60, 
    true
  )
ON CONFLICT DO NOTHING;

-- Step 5: Verify the data was inserted
SELECT 
  id,
  name,
  price,
  category,
  inventory_count,
  is_active,
  created_at
FROM products 
WHERE is_active = true 
ORDER BY created_at DESC;

-- Step 6: Test the RLS policy (run this as anonymous/public user)
-- You can test this by temporarily disabling RLS or using the API
-- SELECT COUNT(*) FROM products WHERE is_active = true;
