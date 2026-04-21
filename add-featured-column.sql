-- Add is_featured column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for better performance on featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Update some sample products to be featured (optional)
UPDATE products SET is_featured = TRUE WHERE name IN (
  'Wireless Headphones',
  'Organic Coffee Beans',
  'Smart Watch'
) LIMIT 3;
