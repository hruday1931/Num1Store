# Fix Database Errors - Manual Instructions

## Problems
1. **Featured Products Error**: The `is_featured` column doesn't exist in the products table
2. **Categories Error**: The `categories` table doesn't exist in the database

## Solution
You need to run these SQL commands in your Supabase SQL Editor:

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run these SQL commands in order:

#### Fix 1: Add is_featured column to products table
```sql
-- Add is_featured column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
```

```sql
-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
```

```sql
-- Mark some existing products as featured (optional)
UPDATE products SET is_featured = TRUE WHERE 
  name ILIKE '%headphones%' OR 
  name ILIKE '%coffee%' OR 
  name ILIKE '%watch%' OR
  name ILIKE '%smart%' OR
  created_at > NOW() - INTERVAL '30 days'
LIMIT 5;
```

#### Fix 2: Create categories table
```sql
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

```sql
-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read access for active categories)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
```

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
```

```sql
-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, icon_name, sort_order, is_active) VALUES
  ('Electronics', 'electronics', 'Gadgets, devices, and tech accessories', '/images/categories/electronics.jpg', 'Cpu', 1, true),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories', '/images/categories/fashion.jpg', 'Shirt', 2, true),
  ('Home & Living', 'home-living', 'Furniture, decor, and household items', '/images/categories/home.jpg', 'Home', 3, true),
  ('Sports', 'sports', 'Fitness equipment and athletic gear', '/images/categories/sports.jpg', 'Dumbbell', 4, true),
  ('Books', 'books', 'Literature, textbooks, and reading materials', '/images/categories/books.jpg', 'BookOpen', 5, true),
  ('Toys & Games', 'toys-games', 'Children toys, board games, and puzzles', '/images/categories/toys.jpg', 'Gamepad2', 6, true),
  ('Beauty', 'beauty', 'Cosmetics, skincare, and personal care', '/images/categories/beauty.jpg', 'Sparkles', 7, true),
  ('Food & Grocery', 'food-grocery', 'Fresh food, snacks, and beverages', '/images/categories/food.jpg', 'Utensils', 8, true),
  ('Automotive', 'automotive', 'Car parts, accessories, and tools', '/images/categories/automotive.jpg', 'Car', 9, true),
  ('Health', 'health', 'Medicine, supplements, and wellness products', '/images/categories/health.jpg', 'Heart', 10, true)
ON CONFLICT (slug) DO NOTHING;
```

### Step 3: Verify the fix
After running all the SQL commands, refresh your website. Both console errors should be gone and:
- Featured products should display
- Category slider should show categories

### Alternative: If you don't have any products yet
You can insert sample products with the is_featured column:

```sql
-- Insert sample products with featured status
INSERT INTO products (vendor_id, name, description, price, category, images, inventory_count, is_active, is_featured) VALUES
  (gen_random_uuid(), 'Wireless Headphones', 'Premium noise-cancelling wireless headphones', 299.99, 'Electronics', ARRAY['/images/headphones.jpg'], 50, true, true),
  (gen_random_uuid(), 'Organic Coffee Beans', 'Premium arabica coffee beans', 24.99, 'Food', ARRAY['/images/coffee.jpg'], 100, true, true),
  (gen_random_uuid(), 'Smart Watch', 'Fitness tracker with heart rate monitor', 199.99, 'Electronics', ARRAY['/images/watch.jpg'], 30, true, true);
```

## What the code fixes do
- **Featured Products Component**: First tries to fetch products with `is_featured = true`, falls back to all active products if column doesn't exist
- **Categories Component**: Falls back to mock categories if the categories table doesn't exist

## After applying the SQL fixes
Once you add the database structures, both components will automatically use the real data instead of fallbacks.
