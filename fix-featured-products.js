const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFeaturedProducts() {
  try {
    console.log('Adding is_featured column to products table...');
    
    // Add the column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;'
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('Error adding column:', alterError);
    } else {
      console.log('Column added successfully or already exists');
    }
    
    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);'
    });
    
    if (indexError && !indexError.message.includes('already exists')) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('Index created successfully or already exists');
    }
    
    // Update some sample products to be featured
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_featured: true })
      .in('name', ['Wireless Headphones', 'Organic Coffee Beans', 'Smart Watch'])
      .limit(3);
    
    if (updateError) {
      console.error('Error updating featured products:', updateError);
    } else {
      console.log('Sample products marked as featured');
    }
    
    console.log('Featured products fix completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixFeaturedProducts();
