-- Add sample categories to the categories table
-- Run this in Supabase SQL Editor

INSERT INTO categories (name, slug, description, icon_name) VALUES
('Electronics', 'electronics', 'Gadgets, smartphones, laptops, and more', 'Laptop'),
('Fashion', 'fashion', 'Clothing, shoes, and accessories', 'Shirt'),
('Home & Garden', 'home', 'Furniture, decor, and home essentials', 'Home'),
('Beauty', 'beauty', 'Cosmetics, skincare, and personal care', 'Sparkles'),
('Sports & Fitness', 'sports', 'Athletic gear and fitness equipment', 'Dumbbell'),
('Gaming', 'gaming', 'Video games, consoles, and accessories', 'Gamepad2'),
('Books', 'books', 'Fiction, non-fiction, and educational books', 'Book'),
('Automotive', 'automotive', 'Car parts, accessories, and tools', 'Car'),
('Baby & Kids', 'baby', 'Baby products and kids items', 'Baby'),
('Food & Beverages', 'food', 'Groceries, snacks, and drinks', 'Utensils'),
('Music', 'music', 'Instruments, audio equipment, and more', 'Music'),
('Photography', 'photography', 'Cameras, lenses, and photography gear', 'Camera'),
('Accessories', 'accessories', 'Watches, jewelry, and fashion accessories', 'Watch'),
('Smartphones', 'smartphones', 'Mobile phones and accessories', 'Smartphone'),
('Audio', 'audio', 'Headphones, speakers, and audio equipment', 'Headphones'),
('Coffee & Tea', 'coffee', 'Coffee beans, tea, and brewing equipment', 'Coffee'),
('Art & Craft', 'art', 'Art supplies, craft materials, and DIY kits', 'Palette'),
('Travel', 'travel', 'Luggage, travel accessories, and gear', 'Plane')
ON CONFLICT (name) DO NOTHING;
