-- Fix categories table RLS and add sample data
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to add data
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Add sample categories
INSERT INTO categories (name) VALUES 
('Electronics'),
('Clothing'),
('Books'),
('Home & Garden'),
('Sports & Outdoors'),
('Toys & Games'),
('Health & Beauty'),
('Food & Beverages');

-- Re-enable RLS with proper policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

-- Create policy that allows anyone to read categories
CREATE POLICY "Anyone can view categories" ON categories 
FOR SELECT USING (true);

-- Optional: Allow authenticated users to insert categories
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
CREATE POLICY "Authenticated users can insert categories" ON categories 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Verify the data
SELECT * FROM categories ORDER BY name;

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'categories';
