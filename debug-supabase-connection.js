// Debug script to test Supabase connection
// Run this with: node debug-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Check environment variables
console.log('=== Supabase Connection Debug ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'NOT SET');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('\nERROR: Missing environment variables!');
  console.log('Please create a .env.local file with your Supabase credentials.');
  console.log('See env-example.txt for the required format.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('\n=== Testing Supabase Connection ===');
    
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) {
      console.error('   ERROR:', error.message);
      console.error('   Details:', error);
    } else {
      console.log('   SUCCESS: Connection established');
    }
    
    // Test products table
    console.log('\n2. Testing products table...');
    let productsQuery = supabase
      .from('products')
      .select('id, name, price, is_active');
    
    // Try to filter by is_active if the column exists
    try {
      productsQuery = productsQuery.eq('is_active', true);
    } catch (error) {
      console.log('   Note: is_active column not found, fetching all products');
    }
    
    const { data: products, error: productsError } = await productsQuery.limit(5);
      
    if (productsError) {
      console.error('   ERROR:', productsError.message);
      console.error('   Details:', productsError);
    } else {
      console.log(`   SUCCESS: Found ${products.length} products`);
      products.forEach((product, i) => {
        console.log(`     ${i + 1}. ${product.name} - $${product.price}`);
      });
    }
    
    // Test categories table
    console.log('\n3. Testing categories table...');
    let categoriesQuery = supabase
      .from('categories')
      .select('id, name, slug, is_active');
    
    // Try to filter by is_active if the column exists
    try {
      categoriesQuery = categoriesQuery.eq('is_active', true);
    } catch (error) {
      console.log('   Note: is_active column not found, fetching all categories');
    }
    
    const { data: categories, error: categoriesError } = await categoriesQuery.limit(5);
      
    if (categoriesError) {
      console.error('   ERROR:', categoriesError.message);
      console.error('   Details:', categoriesError);
      
      // Check if table doesn't exist
      if (categoriesError.message?.includes('relation "categories" does not exist')) {
        console.log('   Suggestion: Categories table does not exist. Run the database schema.');
      }
    } else {
      console.log(`   SUCCESS: Found ${categories.length} categories`);
      categories.forEach((category, i) => {
        console.log(`     ${i + 1}. ${category.name} (${category.slug})`);
      });
    }
    
    // Test vendors relationship
    console.log('\n4. Testing vendor relationship...');
    let vendorQuery = supabase
      .from('products')
      .select(`
        id,
        name,
        vendor:vendor_id (
          store_name
        )
      `);
    
    // Try to filter by is_active if the column exists
    try {
      vendorQuery = vendorQuery.eq('is_active', true);
    } catch (error) {
      console.log('   Note: is_active column not found, fetching all products');
    }
    
    const { data: productsWithVendors, error: vendorError } = await vendorQuery.limit(3);
      
    if (vendorError) {
      console.error('   ERROR:', vendorError.message);
      console.error('   Details:', vendorError);
    } else {
      console.log(`   SUCCESS: Found ${productsWithVendors.length} products with vendor info`);
      productsWithVendors.forEach((product, i) => {
        const vendorName = product.vendor?.store_name || 'Unknown Vendor';
        console.log(`     ${i + 1}. ${product.name} - Sold by ${vendorName}`);
      });
    }
    
  } catch (error) {
    console.error('\nUNEXPECTED ERROR:', error);
  }
}

testConnection().then(() => {
  console.log('\n=== Debug Complete ===');
}).catch(error => {
  console.error('\nDEBUG SCRIPT ERROR:', error);
});
