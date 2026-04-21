// Debug script to test orders functionality
// Run this with: node debug-orders.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrders() {
  console.log('=== Orders Debug Script ===\n');
  
  try {
    // Test 1: Check if we can authenticate
    console.log('1. Testing authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    if (!session) {
      console.log('No active session found. Please sign in first.');
      return;
    }
    
    console.log('Session found for user:', session.user.id);
    console.log('User email:', session.user.email);
    
    // Test 2: Check orders table structure
    console.log('\n2. Checking orders table structure...');
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'orders' })
      .select('*');
      
    if (columnError) {
      console.error('Error getting table columns:', columnError);
    } else {
      console.log('Orders table columns:');
      columns?.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    }
    
    // Test 3: Try to fetch orders for current user
    console.log('\n3. Testing orders query...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', session.user.id);
      
    if (ordersError) {
      console.error('Orders query error:', ordersError);
      console.error('Error details:', JSON.stringify(ordersError, null, 2));
    } else {
      console.log(`Found ${orders?.length || 0} orders for user`);
      if (orders && orders.length > 0) {
        console.log('First order:', orders[0]);
      }
    }
    
    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'orders');
      
    if (policyError) {
      console.error('Error checking policies:', policyError);
    } else {
      console.log('RLS policies for orders table:');
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugOrders();
