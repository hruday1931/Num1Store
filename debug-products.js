// Debug script to test products table access
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment variables check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductsAccess() {
  try {
    console.log('\nTesting products table access...');
    
    // Test 1: Basic select
    console.log('1. Testing basic SELECT...');
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Success! Found ${count} products`);
    console.log('Sample data:', data?.slice(0, 2));
    
    // Test 2: Test with is_active filter
    console.log('\n2. Testing with is_active filter...');
    const { data: activeData, error: activeError, count: activeCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);
    
    if (activeError) {
      console.error('Error with is_active filter:', activeError);
    } else {
      console.log(`Found ${activeCount} active products`);
    }
    
    // Test 3: Check table schema
    console.log('\n3. Testing table info...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('Available columns:', Object.keys(tableInfo[0]));
    } else {
      console.log('No data in products table');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testProductsAccess();
