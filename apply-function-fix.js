const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function applyFunctionFix() {
  try {
    console.log('Applying function ambiguity fix...');
    
    // First, check what functions exist
    console.log('Checking existing functions...');
    const { data: functions, error: checkError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            proname as function_name,
            pg_get_function_arguments(oid) as arguments,
            pg_get_function_result(oid) as return_type
          FROM pg_proc 
          WHERE proname = 'create_order_with_items'
        `
      });
    
    if (checkError) {
      console.log('Check error (expected if exec_sql doesn\'t exist):', checkError.message);
    } else {
      console.log('Existing functions:', functions);
    }
    
    // Drop the jsonb version
    console.log('Dropping jsonb version of function...');
    const { data: dropResult, error: dropError } = await supabase
      .rpc('exec_sql', {
        sql: `
          DROP FUNCTION IF EXISTS create_order_with_items(
            p_customer_id UUID,
            p_order_items JSONB,
            p_payment_method TEXT,
            p_payment_status TEXT,
            p_shipping_address JSONB,
            p_status TEXT,
            p_total_amount NUMERIC
          );
        `
      });
    
    if (dropError) {
      console.log('Drop error (expected if exec_sql doesn\'t exist):', dropError.message);
    } else {
      console.log('Drop result:', dropResult);
    }
    
    console.log('Function fix applied. You may need to run the SQL manually in Supabase SQL editor.');
    console.log('Please run the contents of fix-function-ambiguity.sql in your Supabase SQL editor.');
    
  } catch (err) {
    console.log('Error applying fix:', err.message);
  }
}

applyFunctionFix();
