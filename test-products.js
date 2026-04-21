// Test script to check products and categories tables
// Usage: node test-products.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTables() {
  try {
    console.log('Testing products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, category, images')
      .eq('is_active', true)
      .limit(5);
    
    if (productsError) {
      console.error('Products table error:', productsError);
    } else {
      console.log(`Found ${products.length} products:`);
      products.forEach(p => {
        console.log(`- ${p.name} (${p.category}) - $${p.price}`);
      });
    }
    
    console.log('\nTesting categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(10);
    
    if (categoriesError) {
      console.error('Categories table error:', categoriesError);
      if (categoriesError.message?.includes('relation "categories" does not exist')) {
        console.log('\nCategories table does not exist. Please run:');
        console.log('1. Open Supabase SQL Editor');
        console.log('2. Run the SQL from create-categories-table.sql');
      }
    } else {
      console.log(`Found ${categories.length} categories:`);
      categories.forEach(c => {
        console.log(`- ${c.name} (${c.slug})`);
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTables();
