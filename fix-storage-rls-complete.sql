-- Complete Fix for StorageApiError: Row Level Security Policy Violation
-- This script addresses both storage buckets and storage objects RLS policies

-- Step 1: Enable RLS on storage schema if not already enabled
DO $$
BEGIN
    -- Enable RLS on storage.buckets
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'storage' AND tablename = 'buckets'
    ) THEN
        RAISE NOTICE 'Storage tables not found - please ensure storage extension is installed';
    ELSE
        ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on storage tables';
    END IF;
END $$;

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

-- Step 3: Create storage buckets policies
-- Allow public access to view buckets (needed for listing)
CREATE POLICY "Public can view buckets" ON storage.buckets
    FOR SELECT USING (true);

-- Allow authenticated users to create buckets (if needed)
CREATE POLICY "Authenticated can create buckets" ON storage.buckets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow bucket owners to manage their buckets
CREATE POLICY "Bucket owners can manage buckets" ON storage.buckets
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            -- User created the bucket
            id IN (
                SELECT id FROM storage.buckets 
                WHERE id = storage.buckets.id 
                AND auth.uid()::text = any(ARRAY SELECT jsonb_array_elements_text(avl::jsonb->'owners'))
            )
            -- OR user is admin (optional)
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.is_admin = true
            )
        )
    );

-- Step 4: Create storage objects policies
-- Allow public access to view files in public buckets
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

-- Step 5: Grant proper permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.objects TO anon;

-- Step 6: Ensure the product-images bucket exists and is properly configured
DO $$
BEGIN
    -- Check if bucket exists, create if not
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE name = 'product-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            gen_random_uuid(),
            'product-images',
            true,
            2097152, -- 2MB
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        );
        RAISE NOTICE 'Created product-images bucket';
    ELSE
        -- Update existing bucket to ensure it's public and has correct settings
        UPDATE storage.buckets 
        SET 
            public = true,
            file_size_limit = 2097152,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        WHERE name = 'product-images';
        RAISE NOTICE 'Updated product-images bucket settings';
    END IF;
END $$;

-- Step 7: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 8: Verify the policies
SELECT 
    'Bucket Policies' as type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'buckets'
ORDER BY policyname

UNION ALL

SELECT 
    'Object Policies' as type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY policyname;

-- Step 9: Test storage access
SELECT 
    'Buckets Available' as info,
    COUNT(*) as count,
    'storage buckets' as type
FROM storage.buckets

UNION ALL

SELECT 
    'Current User Can Upload' as info,
    CASE WHEN auth.role() = 'authenticated' THEN 'YES' ELSE 'NO' END as can_upload,
    'authentication status' as type

UNION ALL

SELECT 
    'Product Images Bucket' as info,
    public::text as is_public,
    'bucket settings' as type
FROM storage.buckets 
WHERE name = 'product-images';
