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

// Use the anon key client but disable RLS for bucket creation
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createBucketsWithRPC() {
  try {
    console.log('Creating buckets using RPC function...');
    
    // Try to create buckets using RPC (bypasses RLS)
    const { data, error } = await supabase.rpc('create_storage_buckets', {
      bucket_names: ['products', 'product-images']
    });
    
    if (error) {
      console.error('RPC Error:', error);
      
      // Fallback: Try direct SQL approach
      console.log('Trying direct SQL approach...');
      const { data: sqlData, error: sqlError } = await supabase
        .from('buckets')
        .insert([
          {
            id: 'products',
            name: 'products',
            owner_id: 'authenticated',
            public: true,
            file_size_limit: 10485760,
            allowed_mime_types: ['image/*']
          },
          {
            id: 'product-images',
            name: 'product-images',
            owner_id: 'authenticated',
            public: true,
            file_size_limit: 10485760,
            allowed_mime_types: ['image/*']
          }
        ]);
      
      if (sqlError) {
        console.error('Direct SQL Error:', sqlError);
      } else {
        console.log('Buckets created successfully via direct SQL');
      }
    } else {
      console.log('Buckets created successfully via RPC');
    }
    
    // Verify buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      console.log('\nAvailable buckets:');
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log('- ' + bucket.name + ' (id: ' + bucket.id + ')');
        });
      } else {
        console.log('No buckets found');
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createBucketsWithRPC();
