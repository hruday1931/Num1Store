// Test script to verify image upload functionality
// Run this with: node test-image-upload.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration - replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImageUpload() {
  console.log('Testing image upload functionality...\n');

  try {
    // 1. Test authentication
    console.log('1. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return;
    }

    if (!user) {
      console.log('No authenticated user found. Please sign in first.');
      console.log('You can test this by running the app and signing in as a vendor.');
      return;
    }

    console.log('Authenticated user:', user.id);
    console.log('User email:', user.email);

    // 2. Check if user is a vendor with active subscription
    console.log('\n2. Checking vendor status...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_vendor, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    if (!profile.is_vendor || profile.subscription_status !== 'active') {
      console.log('User is not an active vendor. Image upload requires active vendor subscription.');
      return;
    }

    console.log('Vendor status confirmed - Active vendor');

    // 3. Check storage bucket
    console.log('\n3. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Bucket list error:', bucketError);
      return;
    }

    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      console.log('product-images bucket not found. Please run fix-storage-rls-policies.sql');
      return;
    }

    console.log('product-images bucket found:', productImagesBucket);

    // 4. Test creating a test image file (if we have one)
    console.log('\n4. Testing upload permissions...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const testFileName = `test_${Date.now()}.png`;
    const testFilePath = `vendors/${user.id}/test/${testFileName}`;

    console.log('Uploading test file to:', testFilePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFilePath, testImageData, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      if (uploadError.message.includes('row-level security policy')) {
        console.log('\nRLS Policy Error detected!');
        console.log('Please run the fix-storage-rls-policies.sql script to fix this issue.');
      }
      
      return;
    }

    console.log('Upload successful:', uploadData);

    // 5. Test getting public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(testFilePath);

    console.log('Public URL:', publicUrl);

    // 6. Clean up test file
    console.log('\n5. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([testFilePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log('Test file cleaned up successfully');
    }

    console.log('\n=== Test completed successfully! ===');
    console.log('Image upload functionality is working correctly.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testImageUpload().catch(console.error);
