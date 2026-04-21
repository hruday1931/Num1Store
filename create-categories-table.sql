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

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read access for active categories)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

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
