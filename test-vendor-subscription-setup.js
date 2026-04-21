// Test Vendor Subscription Setup
// Run this with: node test-vendor-subscription-setup.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVendorSubscriptionSetup() {
  console.log('Testing Vendor Subscription Setup...\n');

  try {
    // Test 1: Check if profiles table has vendor columns
    console.log('1. Checking profiles table structure...');
    const { data: profileColumns, error: profileError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .select('column_name, data_type, column_default');

    if (profileError) {
      console.error('Error checking profiles columns:', profileError);
    } else {
      const vendorColumns = profileColumns?.filter(col => 
        ['is_vendor', 'subscription_status', 'phone'].includes(col.column_name)
      );
      console.log('Vendor-related columns in profiles:', vendorColumns);
    }

    // Test 2: Check vendors table structure
    console.log('\n2. Checking vendors table structure...');
    const { data: vendorColumns, error: vendorError } = await supabase
      .rpc('get_table_columns', { table_name: 'vendors' })
      .select('column_name, data_type, column_default');

    if (vendorError) {
      console.error('Error checking vendors columns:', vendorError);
    } else {
      console.log('Vendors table columns:', vendorColumns);
    }

    // Test 3: Check RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'profiles' });

    if (policyError) {
      console.error('Error checking policies:', policyError);
    } else {
      console.log('RLS policies for profiles:', policies);
    }

    // Test 4: Test a simple select query (should work with RLS)
    console.log('\n4. Testing basic query access...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, is_vendor, subscription_status')
      .limit(1);

    if (testError) {
      console.log('Query test failed (expected if no auth):', testError.message);
    } else {
      console.log('Query test succeeded:', testData);
    }

    console.log('\n=== Test Summary ===');
    console.log('If you see column information above, the database structure is correct.');
    console.log('If you see RLS policy information, the policies are correctly set up.');
    console.log('If queries fail with permission errors, RLS is working but needs proper authentication.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Helper function to create the RPC function if it doesn't exist
async function createHelperFunctions() {
  console.log('Creating helper functions for testing...');
  
  // Function to get table columns
  const createColumnsFunction = `
    CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
    RETURNS TABLE(column_name TEXT, data_type TEXT, column_default TEXT)
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        column_name::TEXT,
        data_type::TEXT,
        column_default::TEXT
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = get_table_columns.table_name
      ORDER BY ordinal_position;
    $$;
  `;

  // Function to get RLS policies
  const createPoliciesFunction = `
    CREATE OR REPLACE FUNCTION get_table_policies(table_name TEXT)
    RETURNS TABLE(policyname TEXT, cmd TEXT, qual TEXT, with_check TEXT)
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        policyname::TEXT,
        cmd::TEXT,
        qual::TEXT,
        with_check::TEXT
      FROM pg_policies 
      WHERE tablename = get_table_policies.table_name
      ORDER BY policyname;
    $$;
  `;

  try {
    await supabase.rpc('exec_sql', { sql: createColumnsFunction });
    await supabase.rpc('exec_sql', { sql: createPoliciesFunction });
    console.log('Helper functions created successfully');
  } catch (error) {
    console.log('Helper functions may already exist or need manual creation');
  }
}

// Run the tests
testVendorSubscriptionSetup();
