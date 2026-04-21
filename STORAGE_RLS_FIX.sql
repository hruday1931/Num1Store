-- STORAGE RLS POLICY FIX
-- Run this in your Supabase SQL Editor to fix storage upload issues

-- 1. Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
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

-- 3. Create bucket policies
-- Allow public to view buckets
CREATE POLICY "Public can view buckets" ON storage.buckets
    FOR SELECT USING (true);

-- Allow authenticated users to create buckets
CREATE POLICY "Authenticated can create buckets" ON storage.buckets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow bucket owners to manage their buckets
CREATE POLICY "Bucket owners can manage buckets" ON storage.buckets
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.uid()::text = any(ARRAY SELECT jsonb_array_elements_text(avl::jsonb->'owners'))
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.is_admin = true
            )
        )
    );

-- 4. Create object policies
-- Allow public to view files in public buckets
CREATE POLICY "Public can view files in public buckets" ON storage.objects
    FOR SELECT USING (
        bucket_id IN (
            SELECT id FROM storage.buckets 
            WHERE public = true
        )
    );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            -- Upload to public buckets
            bucket_id IN (
                SELECT id FROM storage.buckets 
                WHERE public = true
            )
            -- OR upload to their own bucket
            OR (
                bucket_id IN (
                    SELECT id FROM storage.buckets 
                    WHERE auth.uid()::text = any(ARRAY SELECT jsonb_array_elements_text(avl::jsonb->'owners'))
                )
            )
            -- OR vendor uploading to product-images bucket
            OR (
                bucket_id = 'product-images'
                AND EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.is_vendor = true 
                    AND profiles.subscription_status = 'active'
                )
            )
        )
    );

-- Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (
            -- Files in public buckets
            bucket_id IN (
                SELECT id FROM storage.buckets 
                WHERE public = true
            )
            -- OR their own files
            OR (
                bucket_id IN (
                    SELECT id FROM storage.buckets 
                    WHERE auth.uid()::text = any(ARRAY SELECT jsonb_array_elements_text(avl::jsonb->'owners'))
                )
            )
            -- OR vendor files in product-images
            OR (
                bucket_id = 'product-images'
                AND EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.is_vendor = true
                )
            )
        )
    );

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (
            -- Files in buckets they own
            bucket_id IN (
                SELECT id FROM storage.buckets 
                WHERE auth.uid()::text = any(ARRAY SELECT jsonb_array_elements_text(avl::jsonb->'owners'))
            )
            -- OR vendor files in product-images
            OR (
                bucket_id = 'product-images'
                AND EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.is_vendor = true
                )
            )
        )
    );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (
            -- Files in buckets they own
            bucket_id IN (
                SELECT id FROM storage.buckets 
                WHERE auth.uid()::text = any(ARRAY SELECT jsonb_array_elements_text(avl::jsonb->'owners'))
            )
            -- OR vendor files in product-images
            OR (
                bucket_id = 'product-images'
                AND EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.is_vendor = true
                )
                -- Additional check: can only delete files in their vendor folder
                AND (name LIKE 'vendors/' || auth.uid()::text || '/%')
            )
        )
    );

-- 5. Grant permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.objects TO anon;

-- 6. Ensure product-images bucket exists
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

-- 7. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Verify policies
SELECT 'Bucket Policies Created' as status, COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'buckets' AND schemaname = 'storage'

UNION ALL

SELECT 'Object Policies Created' as status, COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
