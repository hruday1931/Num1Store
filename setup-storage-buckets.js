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

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupStorageBuckets() {
  try {
    console.log('Setting up storage buckets...');
    
    // Create 'products' bucket (used in product edit page)
    console.log('Creating "products" bucket...');
    const { data: productsBucket, error: productsError } = await supabase.storage.createBucket('products', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (productsError) {
      if (productsError.message.includes('already exists')) {
        console.log('Products bucket already exists');
      } else {
        console.error('Error creating products bucket:', productsError);
      }
    } else {
      console.log('Products bucket created successfully');
    }
    
    // Create 'product-images' bucket (used in storage utility)
    console.log('Creating "product-images" bucket...');
    const { data: productImagesBucket, error: productImagesError } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (productImagesError) {
      if (productImagesError.message.includes('already exists')) {
        console.log('Product-images bucket already exists');
      } else {
        console.error('Error creating product-images bucket:', productImagesError);
      }
    } else {
      console.log('Product-images bucket created successfully');
    }
    
    // List all buckets to verify
    console.log('\nVerifying buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      console.log('Available buckets:');
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log('- ' + bucket.name + ' (id: ' + bucket.id + ', public: ' + bucket.public + ')');
        });
      } else {
        console.log('No buckets found');
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

setupStorageBuckets();
