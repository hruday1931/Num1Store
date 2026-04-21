const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Read the SQL file
const fs = require('fs');
const path = require('path');

async function runStorageFix() {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    );

    console.log('=== Storage RLS Fix Script ===');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Running storage RLS policy fixes...\n');

    // Read and execute the SQL fix
    const sqlFilePath = path.join(__dirname, 'fix-storage-rls-complete.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip certain statements that can't be executed via client
      if (statement.includes('pg_policies') || 
          statement.includes('NOTIFY pgrst') ||
          statement.includes('RAISE NOTICE')) {
        console.log(`Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`);
        continue;
      }

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.log(`Statement ${i + 1} failed:`, error.message);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.log(`Statement ${i + 1} error:`, stmtError.message);
      }
    }

    // Test bucket access
    console.log('\n=== Testing Bucket Access ===');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
    } else {
      console.log('Available buckets:', buckets);
      
      const productImagesBucket = buckets?.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('Product-images bucket found:', productImagesBucket);
      } else {
        console.log('Product-images bucket not found - will be created on first upload');
      }
    }

    console.log('\n=== Storage Fix Complete ===');

  } catch (error) {
    console.error('Error running storage fix:', error);
  }
}

runStorageFix();
