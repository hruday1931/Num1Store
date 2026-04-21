-- Debug Storage RLS Issues
-- Run this to diagnose the specific RLS problem

-- Check if storage tables exist
SELECT 
    'Storage Tables' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;

-- Check current storage policies
SELECT 
    'Current Storage Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- Check storage buckets
SELECT 
    'Storage Buckets' as info,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- Check current user's authentication status
SELECT 
    'Current User' as info,
    auth.uid() as user_id,
    auth.role() as role,
    auth.jwt() as has_jwt;

-- Test specific storage operations that might fail
SELECT 
    'Test Access' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'product-images') 
        THEN 'product-images bucket exists'
        ELSE 'product-images bucket missing'
    END as bucket_status;

-- Check if user has proper profile for vendor access
SELECT 
    'User Profile' as info,
    p.id,
    p.is_vendor,
    p.subscription_status,
    p.is_admin,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Profile exists'
        ELSE 'No profile found'
    END as profile_status
FROM profiles p
WHERE p.id = auth.uid();
