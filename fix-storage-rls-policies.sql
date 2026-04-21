-- Fix Storage RLS Policies for Product Images
-- Run this script to ensure proper storage permissions for vendors

-- First, enable RLS on storage objects if not already enabled
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;

-- Create policies for product-images bucket

-- 1. Allow authenticated users to view images in product-images bucket
CREATE POLICY "Allow authenticated users to view product images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = 'vendors' AND
    auth.role() = 'authenticated'
);

-- 2. Allow vendors to upload images to their own folder
CREATE POLICY "Allow vendors to upload to their folder" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = 'vendors' AND
    (storage.foldername(name))[2] = auth.uid()::text AND
    auth.role() = 'authenticated'
);

-- 3. Allow vendors to update their own images
CREATE POLICY "Allow vendors to update their own images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = 'vendors' AND
    (storage.foldername(name))[2] = auth.uid()::text AND
    auth.role() = 'authenticated'
);

-- 4. Allow vendors to delete their own images
CREATE POLICY "Allow vendors to delete their own images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = 'vendors' AND
    (storage.foldername(name))[2] = auth.uid()::text AND
    auth.role() = 'authenticated'
);

-- Ensure the product-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images', 
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Verify the policies were created
SELECT 
    'Storage Policies Created' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
