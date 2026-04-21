const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkFunction() {
  try {
    console.log('Checking if create_order_with_items function exists...');
    
    const { data, error } = await supabase.rpc('create_order_with_items', {
      p_customer_id: '00000000-0000-0000-0000-000000000000',
      p_total_amount: 0,
      p_status: 'test',
      p_payment_method: 'test',
      p_payment_status: 'test',
      p_shipping_address: 'test',
      p_order_items: []
    });
    
    if (error) {
      console.log('Function exists but error:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('Function exists and is callable');
      console.log('Response:', data);
    }
  } catch (err) {
    console.log('Function does not exist or other error:', err.message);
  }
}

checkFunction();
