const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addSampleCategories() {
  try {
    console.log('Adding sample categories...');
    
    const sampleCategories = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Books', slug: 'books' },
      { name: 'Home & Garden', slug: 'home-garden' },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
      { name: 'Toys & Games', slug: 'toys-games' },
      { name: 'Health & Beauty', slug: 'health-beauty' },
      { name: 'Food & Beverages', slug: 'food-beverages' }
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
          console.log(`- ${cat.name} (${cat.slug})`);
        });
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addSampleCategories();
