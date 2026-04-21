const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFunction() {
  try {
    console.log('Testing create_order_with_items function...');
    
    const { data, error } = await supabase
      .rpc('create_order_with_items', {
        p_customer_id: '00000000-0000-0000-0000-000000000000',
        p_total_amount: 100,
        p_status: 'pending',
        p_payment_method: 'cod',
        p_payment_status: 'pending',
        p_shipping_address: '{"street": "Test Street", "city": "Test City"}',
        p_order_items: [{'product_id': '00000000-0000-0000-0000-000000000000', 'quantity': 1, 'price': 100}]
      });
    
    console.log('Function result:', data);
    console.log('Function error:', error);
    console.log('Data type:', typeof data);
    console.log('Data keys:', data ? Object.keys(data) : 'No keys');
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('First result:', data[0]);
      console.log('First result type:', typeof data[0]);
      console.log('First result keys:', data[0] ? Object.keys(data[0]) : 'No keys');
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testFunction();
