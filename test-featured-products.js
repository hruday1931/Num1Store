// Quick test script to verify featured products functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFeaturedProducts() {
  console.log('Testing featured products query...');
  
  try {
    // Test 1: Check if columns exist
    console.log('\n1. Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('Error checking table structure:', columnsError.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      const sampleProduct = columns[0];
      console.log('Available columns:', Object.keys(sampleProduct));
      
      const hasIsActive = 'is_active' in sampleProduct;
      const hasIsFeatured = 'is_featured' in sampleProduct;
      
      console.log(`is_active column exists: ${hasIsActive}`);
      console.log(`is_featured column exists: ${hasIsFeatured}`);
    }
    
    // Test 2: Query featured products
    console.log('\n2. Querying featured products...');
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (featuredError) {
      console.error('Error fetching featured products:', featuredError.message);
      return;
    }
    
    console.log(`Found ${featuredProducts?.length || 0} featured products`);
    
    if (featuredProducts && featuredProducts.length > 0) {
      console.log('Sample featured product:', {
        id: featuredProducts[0].id,
        name: featuredProducts[0].name,
        is_featured: featuredProducts[0].is_featured,
        is_active: featuredProducts[0].is_active,
        price: featuredProducts[0].price
      });
    } else {
      console.log('No featured products found. You may need to set some products as featured:');
      console.log('UPDATE products SET is_featured = true WHERE is_active = true LIMIT 5;');
    }
    
    console.log('\n3. Test completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testFeaturedProducts();
