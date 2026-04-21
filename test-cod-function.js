const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFunction() {
  try {
    console.log('Testing create_order_with_items function...');
    
    const { data, error } = await supabase.rpc('create_order_with_items', {
      p_customer_id: '00000000-0000-0000-0000-000000000000',
      p_total_amount: 100,
      p_status: 'pending',
      p_payment_method: 'cod',
      p_payment_status: 'pending',
      p_shipping_address: '{}',
      p_order_items: []
    });
    
    console.log('Function test result:');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
    
    if (error) {
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  } catch (err) {
    console.log('Function test error:', err.message);
  }
}

testFunction();
