-- Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT DEFAULT 'Shop Now',
  cta_link TEXT,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- Create policies (public read access for active banners)
CREATE POLICY "Anyone can view active hero banners" ON hero_banners FOR SELECT USING (is_active = true);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_hero_banners_sort_order ON hero_banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_hero_banners_is_active ON hero_banners(is_active);

-- Insert sample hero banners
INSERT INTO hero_banners (title, subtitle, cta_text, cta_link, image_url, is_active, sort_order) VALUES
  ('Electronics Week', 'Best deals on gadgets & tech', 'Shop Now', '/products?category=electronics', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&h=600&fit=crop&auto=format&q=80', true, 1),
  ('New Arrivals', 'Discover the latest trends', 'Shop Now', '/products?filter=new', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop&auto=format&q=80', true, 2),
  ('Fashion Forward', 'Style that speaks to you', 'Shop Now', '/products?category=fashion', 'https://images.unsplash.com/photo-1487349384427-3741e02eaecc?w=1920&h=600&fit=crop&auto=format&q=80', true, 3),
  ('Summer Sale', 'Up to 50% off on selected items', 'Shop Now', '/products?sale=summer', 'https://images.unsplash.com/photo-1607082315436-554ba90b0008?w=1920&h=600&fit=crop&auto=format&q=80', true, 4),
  ('Home Essentials', 'Transform your living space', 'Shop Now', '/products?category=home', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=600&fit=crop&auto=format&q=80', true, 5)
ON CONFLICT DO NOTHING;
