const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrderItems() {
  console.log('=== Debugging Order Items Access ===');
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  if (!user) {
    console.log('No user authenticated');
    return;
  }
  
  console.log('User authenticated:', user.id);
  
  // First, check if user has any orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', user.id);
    
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }
  
  console.log('User orders:', orders?.length || 0);
  
  if (orders && orders.length > 0) {
    const orderId = orders[0].id;
    console.log('Testing order items for order:', orderId);
    
    // Try to fetch order items for this order
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
      
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      console.error('Full error:', JSON.stringify(itemsError, null, 2));
    } else {
      console.log('Order items found:', items?.length || 0);
    }
  }
}

debugOrderItems().catch(console.error);
