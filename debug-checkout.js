// Debug script to identify checkout issues
const { createClient } = require('./src/utils/supabase/server');

async function debugCheckout() {
  console.log('=== Debugging Checkout Issues ===\n');
  
  try {
    // 1. Check environment variables
    console.log('1. Checking environment variables:');
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'SET' : 'MISSING');
    console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'MISSING');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    console.log('');

    // 2. Test Supabase connection
    console.log('2. Testing Supabase connection:');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('Auth Error:', authError.message);
    } else {
      console.log('Auth Status:', user ? 'User authenticated' : 'No user found');
      if (user) {
        console.log('User ID:', user.id);
        console.log('User Email:', user.email);
      }
    }
    console.log('');

    // 3. Check if tables exist
    console.log('3. Checking database tables:');
    
    // Check orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    if (ordersError) {
      console.log('Orders Table Error:', ordersError.message);
      console.log('Orders Table Details:', ordersError.details);
    } else {
      console.log('Orders Table: OK');
    }
    
    // Check order_items table
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('count')
      .limit(1);
    
    if (orderItemsError) {
      console.log('Order Items Table Error:', orderItemsError.message);
      console.log('Order Items Table Details:', orderItemsError.details);
    } else {
      console.log('Order Items Table: OK');
    }
    console.log('');

    // 4. Check profiles table
    console.log('4. Checking profiles table:');
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.log('Profile Error:', profileError.message);
        console.log('Profile Details:', profileError.details);
      } else {
        console.log('Profile: OK');
      }
    } else {
      console.log('Profile: Cannot check - no authenticated user');
    }
    console.log('');

    // 5. Test Razorpay connection (if credentials exist)
    console.log('5. Testing Razorpay connection:');
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        // Test with a minimal order creation
        const testOrder = await razorpay.orders.create({
          amount: 100, // 1 rupee
          currency: 'INR',
          receipt: 'test_receipt',
          payment_capture: 1,
        });
        
        console.log('Razorpay: OK - Test order created:', testOrder.id);
        
        // Clean up test order
        try {
          await razorpay.orders.fetch(testOrder.id);
          console.log('Note: Test order created - you may want to cancel it in Razorpay dashboard');
        } catch (fetchError) {
          console.log('Could not fetch test order (this is normal)');
        }
      } catch (razorpayError) {
        console.log('Razorpay Error:', razorpayError.message);
      }
    } else {
      console.log('Razorpay: Cannot test - missing credentials');
    }

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugCheckout();
