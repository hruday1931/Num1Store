const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(process.cwd(), '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyBuckets() {
  try {
    console.log('=== Storage Bucket Verification ===\n');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Available buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (id: ${bucket.id}, public: ${bucket.public})`);
      });
    } else {
      console.log('No buckets found');
      return;
    }
    
    // Test upload to 'products' bucket
    console.log('\n=== Testing Upload to "products" Bucket ===');
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = 'test-' + Date.now() + '.txt';
    const testFilePath = 'test/' + testFileName;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(testFilePath, testFile);
    
    if (uploadError) {
      console.error('Upload test failed:', uploadError);
      
      if (uploadError.message.includes('Bucket not found')) {
        console.log('Solution: Run the SQL script in setup-storage-buckets.sql');
      } else if (uploadError.message.includes('row-level security')) {
        console.log('Solution: Check RLS policies and user authentication');
      }
    } else {
      console.log('Upload test successful!');
      console.log('File path:', uploadData.path);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('products')
        .remove([uploadData.path]);
      
      if (deleteError) {
        console.error('Error cleaning up test file:', deleteError);
      } else {
        console.log('Test file cleaned up successfully');
      }
    }
    
    // Test upload to 'product-images' bucket
    console.log('\n=== Testing Upload to "product-images" Bucket ===');
    const { data: uploadData2, error: uploadError2 } = await supabase.storage
      .from('product-images')
      .upload('test/' + testFileName, testFile);
    
    if (uploadError2) {
      console.error('Upload test failed:', uploadError2);
    } else {
      console.log('Upload test successful!');
      
      // Clean up test file
      await supabase.storage
        .from('product-images')
        .remove([uploadData2.path]);
      console.log('Test file cleaned up successfully');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verifyBuckets();
