const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProductsSchema() {
  try {
    console.log('=== Checking Products Schema ===\n');
    
    // Get one product to see the actual columns
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Product columns found:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]} (${data[0][key]})`);
      });
    }
    
    // Try different status column names
    const statusColumns = ['status', 'is_active', 'active', 'published'];
    
    console.log('\n=== Testing Status Columns ===');
    for (const col of statusColumns) {
      try {
        const { data: testData, error: testError } = await supabase
          .from('products')
          .select('count')
          .eq(col, true)
          .limit(1);
        
        if (testError) {
          console.log(`❌ ${col}: ${testError.message}`);
        } else {
          console.log(`✅ ${col}: Found ${testData?.[0]?.count || 0} active products`);
        }
      } catch (err) {
        console.log(`❌ ${col}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkProductsSchema().then(() => {
  console.log('\n=== Check Complete ===');
});
