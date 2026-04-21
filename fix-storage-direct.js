const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixStorageIssues() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('=== Direct Storage Fix ===');
    console.log('User authentication check...');

    // First, let's check if we can authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    if (!user) {
      console.log('No authenticated user found. This might be the issue.');
      console.log('Storage uploads require authenticated users with proper roles.');
      return;
    }

    console.log('Authenticated user:', user.id, user.email);

    // Check user profile for vendor status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_vendor, subscription_status, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('User profile:', profile);

    // Try to create the product-images bucket directly
    console.log('\n=== Creating Product Images Bucket ===');
    
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 2097152 // 2MB
      });

      if (bucketError) {
        if (bucketError.message.includes('already exists')) {
          console.log('Bucket already exists');
        } else {
          console.error('Bucket creation error:', bucketError);
        }
      } else {
        console.log('Bucket created successfully:', bucketData);
      }
    } catch (createError) {
      console.error('Bucket creation exception:', createError);
    }

    // List buckets to verify
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      console.log('Available buckets:', buckets);
    }

    // Test a simple upload to check permissions
    console.log('\n=== Testing Upload Permissions ===');
    
    // Create a small test file
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(testFileName, testFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'text/plain'
        });

      if (uploadError) {
        console.error('Upload test failed:', uploadError);
        
        if (uploadError.message.includes('row-level security policy')) {
          console.log('\n=== RLS Policy Issue Detected ===');
          console.log('The upload is being blocked by Row Level Security policies.');
          console.log('This typically means:');
          console.log('1. The user is not authenticated properly');
          console.log('2. The user does not have vendor status with active subscription');
          console.log('3. The storage policies are too restrictive');
          console.log('\n=== Recommended Fixes ===');
          console.log('1. Ensure user is authenticated and has vendor status');
          console.log('2. Check subscription_status is "active"');
          console.log('3. Apply the storage RLS policies from fix-storage-rls-complete.sql');
          console.log('4. Make sure the bucket is public and has proper permissions');
        }
      } else {
        console.log('Upload test successful:', uploadData);
        
        // Clean up test file
        await supabase.storage.from('product-images').remove([testFileName]);
        console.log('Test file cleaned up');
      }
    } catch (uploadException) {
      console.error('Upload test exception:', uploadException);
    }

    console.log('\n=== Storage Diagnostic Complete ===');

  } catch (error) {
    console.error('Error in storage fix:', error);
  }
}

fixStorageIssues();
