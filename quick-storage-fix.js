const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function quickStorageFix() {
  try {
    console.log('=== Quick Storage RLS Fix ===');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing required environment variables');
      return;
    }
    
    console.log('Creating Supabase client...');
    
    const supabase = createClient(supabaseUrl, anonKey);
    
    // First, let's check the current authentication status
    console.log('Checking authentication...');
    
    // Try to sign in with a test user or get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('Auth error (expected if not signed in):', authError.message);
    } else {
      console.log('Current user:', user?.id, user?.email);
    }
    
    // Check if bucket exists
    console.log('\nChecking product-images bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      
      if (bucketError.message.includes('row-level security')) {
        console.log('\n=== RLS Policy Issue Detected ===');
        console.log('The bucket listing is blocked by RLS policies.');
        console.log('This means we need to fix the storage policies first.');
        console.log('\n=== Manual Fix Required ===');
        console.log('Please go to your Supabase dashboard:');
        console.log('1. Go to Storage > Policies');
        console.log('2. Look for policies on storage.buckets and storage.objects');
        console.log('3. Either:');
        console.log('   - Delete existing storage policies and recreate them, OR');
        console.log('   - Add a policy that allows authenticated users to access storage');
        console.log('\n=== Quick Fix SQL ===');
        console.log('Run this in your Supabase SQL Editor:');
        console.log(`
-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Public uploads are allowed" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow public bucket access" ON storage.buckets
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND bucket_id = 'product-images'
    );

CREATE POLICY "Allow public file access" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

-- Grant permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.objects TO anon;
        `);
      }
    } else {
      console.log('Available buckets:', buckets);
      
      const productBucket = buckets.find(b => b.name === 'product-images');
      if (productBucket) {
        console.log('Product images bucket exists:', productBucket);
      } else {
        console.log('Product images bucket does not exist');
      }
    }
    
    // Test a simple storage operation
    console.log('\nTesting storage permissions...');
    
    // Try to create the bucket if it doesn't exist
    try {
      const { data: createData, error: createError } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 2097152
      });
      
      if (createError) {
        if (createError.message.includes('already exists')) {
          console.log('Bucket already exists');
        } else {
          console.error('Error creating bucket:', createError);
        }
      } else {
        console.log('Bucket created successfully:', createData);
      }
    } catch (createException) {
      console.error('Exception creating bucket:', createException);
    }
    
    console.log('\n=== Fix Complete ===');
    console.log('If you still see RLS errors, please run the SQL provided above in your Supabase SQL Editor.');
    
  } catch (error) {
    console.error('Error in quick storage fix:', error);
  }
}

quickStorageFix();
