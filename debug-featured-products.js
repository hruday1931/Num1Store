const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugProducts() {
  try {
    console.log('Fetching products from Supabase...');
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${data?.length || 0} products`);
    
    if (data && data.length > 0) {
      console.log('Sample product:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\nProduct images:');
      data.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}: ${product.images}`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debugProducts();
