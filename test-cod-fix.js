const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCODFix() {
  console.log('=== TESTING COD FIX ===');
  
  try {
    // Test 1: Check if function exists and is unique
    console.log('\n1. Checking function uniqueness...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            proname as function_name,
            pg_get_function_arguments(oid) as arguments
          FROM pg_proc 
          WHERE proname = 'create_order_with_items'
        `
      });
    
    if (funcError) {
      console.log('Error checking functions:', funcError);
    } else {
      console.log('Found functions:', functions?.length || 0);
      if (functions) {
        functions.forEach((func, index) => {
          console.log(`Function ${index + 1}:`, func.arguments);
        });
      }
    }
    
    // Test 2: Try to call the function with valid test data
    console.log('\n2. Testing function call...');
    const { data, error } = await supabase.rpc('create_order_with_items', {
      p_customer_id: '00000000-0000-0000-0000-000000000000',
      p_total_amount: 100,
      p_status: 'pending',
      p_payment_method: 'cod',
      p_payment_status: 'pending',
      p_shipping_address: '{"street": "Test Street", "city": "Test City"}',
      p_order_items: []
    });
    
    console.log('Function test result:');
    console.log('Success:', data?.[0]?.success);
    console.log('Error Message:', data?.[0]?.error_message);
    console.log('Order ID:', data?.[0]?.order_id);
    
    if (error) {
      console.log('Function call error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.code === 'PGRST203') {
        console.log('\n❌ FUNCTION OVERLOAD CONFLICT DETECTED');
        console.log('You need to run the fix-cod-errors-complete.sql script first!');
      }
    } else {
      console.log('\n✅ Function is working correctly!');
    }
    
  } catch (err) {
    console.log('Test script error:', err.message);
  }
}

testCODFix();
