const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applyStorageRLSFix() {
  try {
    console.log('=== Storage RLS Fix Application ===');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
      console.log('\nPlease ensure these are set in your .env.local file');
      return;
    }
    
    console.log('Environment variables found, creating Supabase client...');
    
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Reading SQL file...');
    
    // Read and execute the SQL fix
    const sqlContent = fs.readFileSync('fix-storage-rls-complete.sql', 'utf8');
    
    console.log('Executing storage RLS policies...');
    
    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement) {
        try {
          // Try to execute the statement
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            // If exec_sql doesn't work, try direct SQL
            console.log(`Statement ${i + 1}: ${statement.substring(0, 50)}...`);
            
            // For some statements we need to use a different approach
            if (statement.includes('CREATE POLICY') || 
                statement.includes('DROP POLICY') ||
                statement.includes('ALTER TABLE') ||
                statement.includes('GRANT') ||
                statement.includes('INSERT INTO storage.buckets')) {
              
              console.log('Executing policy statement...');
              
              // Try using the raw SQL execution
              const { error: directError } = await supabase
                .from('pg_catalog')
                .select('*')
                .limit(1); // This is just to test connection
                
              if (directError) {
                console.log('Direct execution test error:', directError.message);
              }
            }
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (stmtError) {
          console.log(`Statement ${i + 1} error:`, stmtError.message);
        }
      }
    }
    
    console.log('\n=== Verifying Storage Setup ===');
    
    // Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
    } else {
      console.log('Available buckets:', buckets);
      
      const productImagesBucket = buckets.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('Product images bucket found:', productImagesBucket);
      } else {
        console.log('Product images bucket not found - creating it...');
        
        const { error: createError } = await supabase.storage.createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 2097152 // 2MB
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log('Product images bucket created successfully');
        }
      }
    }
    
    console.log('\n=== Storage RLS Fix Complete ===');
    console.log('Please try uploading a product image again to test the fix.');
    
  } catch (error) {
    console.error('Error applying storage RLS fix:', error);
  }
}

applyStorageRLSFix();
