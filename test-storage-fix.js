// Test script to verify storage RLS fix
// Run with: node test-storage-fix.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageAccess() {
  console.log('Testing Storage Access...\n');

  try {
    // Test 1: List buckets
    console.log('1. Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   Error listing buckets:', bucketsError.message);
    } else {
      console.log(`   Found ${buckets?.length || 0} buckets`);
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    }

    // Test 2: Check if product-images bucket exists
    console.log('\n2. Checking product-images bucket...');
    const productImagesBucket = buckets?.find(b => b.name === 'product-images');
    
    if (productImagesBucket) {
      console.log('   product-images bucket exists');
      console.log(`   Public: ${productImagesBucket.public}`);
      console.log(`   File size limit: ${productImagesBucket.file_size_limit} bytes`);
    } else {
      console.log('   product-images bucket not found');
    }

    // Test 3: Test file upload (create a small test file)
    console.log('\n3. Testing file upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('   Upload error:', uploadError.message);
      
      if (uploadError.message.includes('row-level security policy')) {
        console.log('   This is likely an RLS policy issue. Run the fix-storage-rls-complete.sql script.');
      }
    } else {
      console.log('   Upload successful:', uploadData.path);
      
      // Test 4: Test file deletion
      console.log('\n4. Testing file deletion...');
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([uploadData.path]);

      if (deleteError) {
        console.error('   Delete error:', deleteError.message);
      } else {
        console.log('   Delete successful');
      }
    }

    // Test 5: Check user authentication status
    console.log('\n5. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('   Not authenticated or session expired');
    } else if (user) {
      console.log(`   Authenticated as: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      
      // Check if user has vendor profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_vendor, subscription_status, is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('   Profile not found or error:', profileError.message);
      } else {
        console.log('   Profile:', profile);
      }
    } else {
      console.log('   No user session');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testStorageAccess();
