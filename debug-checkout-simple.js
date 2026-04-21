// Simple debug script to identify checkout issues
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('Supabase Connection Error:', error.message);
      console.log('Error Details:', error.details);
      console.log('Error Hint:', error.hint);
    } else {
      console.log('Supabase Connection: OK');
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
      if (ordersError.hint) console.log('Orders Table Hint:', ordersError.hint);
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
      if (orderItemsError.hint) console.log('Order Items Hint:', orderItemsError.hint);
    } else {
      console.log('Order Items Table: OK');
    }
    
    // Check products table
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (productsError) {
      console.log('Products Table Error:', productsError.message);
      console.log('Products Table Details:', productsError.details);
      if (productsError.hint) console.log('Products Table Hint:', productsError.hint);
    } else {
      console.log('Products Table: OK');
    }
    console.log('');

    // 4. Test Razorpay connection (if credentials exist)
    console.log('4. Testing Razorpay connection:');
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        console.log('Razorpay Client: Created successfully');
        
        // Test with a minimal order creation
        try {
          const testOrder = await razorpay.orders.create({
            amount: 100, // 1 rupee
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now(),
            payment_capture: 1,
          });
          
          console.log('Razorpay: OK - Test order created:', testOrder.id);
          console.log('Note: Test order created - you may want to cancel it in Razorpay dashboard');
        } catch (orderError) {
          console.log('Razorpay Order Creation Error:', orderError.message);
        }
      } catch (razorpayError) {
        console.log('Razorpay Initialization Error:', razorpayError.message);
      }
    } else {
      console.log('Razorpay: Cannot test - missing credentials');
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        console.log('  - NEXT_PUBLIC_RAZORPAY_KEY_ID is missing');
      }
      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.log('  - RAZORPAY_KEY_SECRET is missing');
      }
    }

    console.log('\n=== Debug Complete ===');
    console.log('If you see table errors above, you may need to run the database schema setup.');
    console.log('Check the database_schema.sql file and apply it to your Supabase project.');

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugCheckout();
