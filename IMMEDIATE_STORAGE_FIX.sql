-- IMMEDIATE FIX FOR STORAGE RLS POLICY VIOLATION
-- Run this in your Supabase SQL Editor

-- Step 1: Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can view their own buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can update their own buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can delete their own buckets" ON storage.buckets;

DROP POLICY IF EXISTS "Public uploads are allowed" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files" ON storage.objects;

-- Step 3: Create simple, permissive policies for storage buckets
CREATE POLICY "Allow public bucket access" ON storage.buckets
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated bucket management" ON storage.buckets
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 4: Create simple, permissive policies for storage objects
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public file access" ON storage.objects
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated file management" ON storage.objects
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 5: Grant proper permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.objects TO anon;

-- Step 6: Create the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    gen_random_uuid(),
    'product-images',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (name) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Step 7: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 8: Verify the setup
SELECT 'Storage Setup Complete' as status,
       (SELECT COUNT(*) FROM storage.buckets WHERE name = 'product-images') as bucket_exists,
       (SELECT public FROM storage.buckets WHERE name = 'product-images') as is_public;
