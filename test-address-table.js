// Test script to check if shipping_addresses table exists
const { createClient } = require('@supabase/supabase-js');

// You need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  console.log('Or create a .env.local file with these values');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAddressTable() {
  try {
    console.log('Testing shipping_addresses table access...');
    
    // Try to select from the table
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error accessing shipping_addresses table:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      
      if (error.code === 'PGRST116') {
        console.log('\nSOLUTION: The shipping_addresses table does not exist.');
        console.log('Please run the SQL script: create-shipping-addresses-table.sql');
        console.log('You can run this in the Supabase SQL Editor.');
      } else if (error.code === '42501') {
        console.log('\nSOLUTION: RLS (Row Level Security) policies are blocking access.');
        console.log('Please check that RLS policies are properly configured for the shipping_addresses table.');
      }
    } else {
      console.log('SUCCESS: shipping_addresses table is accessible!');
      console.log('Table count query returned:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

testAddressTable();
