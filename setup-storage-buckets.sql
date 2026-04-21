-- Setup Storage Buckets for Num1Store
-- Run this in your Supabase SQL Editor

-- Create 'products' bucket (used in product edit page)
INSERT INTO storage.buckets (id, name, owner_id, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 
  'products', 
  'authenticated', 
  true, 
  10485760, -- 10MB
  ARRAY['image/*']
) ON CONFLICT (id) DO NOTHING;

-- Create 'product-images' bucket (used in storage utility)
INSERT INTO storage.buckets (id, name, owner_id, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  'authenticated', 
  true, 
  10485760, -- 10MB
  ARRAY['image/*']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for 'products' bucket
CREATE POLICY "Users can upload to products bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'products' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'products' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own products" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'products' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'products' AND 
  auth.role() = 'authenticated'
);

-- Create RLS policies for 'product-images' bucket
CREATE POLICY "Users can upload to product-images bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own product-images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own product-images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own product-images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
