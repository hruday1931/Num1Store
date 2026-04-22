const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCategoriesAPI() {
  try {
    console.log('=== Testing Categories API Query ===\n');
    
    // Test the exact query from the API
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon_name')
      .order('name');
    
    if (error) {
      console.error('❌ Categories query error:', error.message);
      console.error('Details:', error);
      
      // Check if table exists and get schema
      console.log('\n=== Checking Categories Schema ===');
      const { data: schemaData, error: schemaError } = await supabase
        .from('categories')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.error('❌ Schema check error:', schemaError.message);
      } else {
        console.log('✅ Categories table exists');
        if (schemaData && schemaData.length > 0) {
          console.log('Columns found:', Object.keys(schemaData[0]));
        } else {
          console.log('Table is empty');
        }
      }
    } else {
      console.log('✅ Categories query works');
      console.log('Found', categories?.length || 0, 'categories');
      categories?.forEach((cat, i) => {
        console.log(`  ${i + 1}. ${cat.name} (${cat.slug})`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkCategoriesAPI().then(() => {
  console.log('\n=== Check Complete ===');
});
