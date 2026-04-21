const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // You need this in your .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixCategoriesRLS() {
  try {
    console.log('Fixing categories RLS policies...');
    
    // First, disable RLS temporarily to add data
    const { error: disableError } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'ALTER TABLE categories DISABLE ROW LEVEL SECURITY;' });
    
    if (disableError) {
      console.error('Error disabling RLS:', disableError);
    } else {
      console.log('RLS disabled temporarily');
    }
    
    // Add sample categories
    const sampleCategories = [
      { name: 'Electronics' },
      { name: 'Clothing' },
      { name: 'Books' },
      { name: 'Home & Garden' },
      { name: 'Sports & Outdoors' },
      { name: 'Toys & Games' },
      { name: 'Health & Beauty' },
      { name: 'Food & Beverages' }
    ];
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(sampleCategories)
      .select();
    
    if (error) {
      console.error('Error adding categories:', error);
    } else {
      console.log('Successfully added sample categories:', data);
    }
    
    // Re-enable RLS with a simple policy that allows all reads
    const rlsSQL = `
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
      CREATE POLICY "Enable read access for all users" ON categories 
      FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON categories;
      CREATE POLICY "Enable insert for authenticated users" ON categories 
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    `;
    
    const { error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', { sql: rlsSQL });
    
    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    } else {
      console.log('RLS policies updated successfully');
    }
    
    // Test with regular client
    const regularClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: testData, error: testError } = await regularClient
      .from('categories')
      .select('*')
      .order('name');
    
    if (testError) {
      console.error('Error with regular client:', testError);
    } else {
      console.log('Success! Categories accessible with regular client:');
      testData.forEach(cat => {
        console.log(`- ${cat.name} (ID: ${cat.id})`);
      });
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Check if service role key is available
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables.');
  console.log('Please add it to your .env.local file');
  console.log('You can find it in your Supabase project settings > API');
} else {
  fixCategoriesRLS();
}
