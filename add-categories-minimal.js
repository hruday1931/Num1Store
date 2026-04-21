const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addMinimalCategories() {
  try {
    console.log('Adding categories with minimal fields...');
    
    // Try with just name first
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .insert([{ name: 'Test Category' }])
      .select();
    
    if (testError) {
      console.error('Error with name-only insert:', testError);
      return;
    }
    
    console.log('Test insert successful:', testData);
    
    // Delete the test entry
    await supabase
      .from('categories')
      .delete()
      .eq('name', 'Test Category');
    
    // Now add the actual categories
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
    
    const { data, error } = await supabase
      .from('categories')
      .insert(sampleCategories)
      .select();
    
    if (error) {
      console.error('Error adding categories:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('Successfully added sample categories:');
      console.log(data);
      
      // Verify the insertion
      const { data: verifyData, error: verifyError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (verifyError) {
        console.error('Error verifying categories:', verifyError);
      } else {
        console.log('\nAll categories in table:');
        verifyData.forEach(cat => {
          console.log(`- ${cat.name} (ID: ${cat.id})`);
        });
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addMinimalCategories();
