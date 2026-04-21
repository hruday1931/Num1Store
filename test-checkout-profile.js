// Test script to verify checkout API profile auto-creation
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCheckoutProfileCreation() {
  console.log('=== Testing Checkout Profile Auto-Creation ===');
  
  try {
    // Test data for checkout
    const testCheckoutData = {
      amount: 10000, // 100.00 in paise
      currency: 'INR',
      cartItems: [
        {
          productId: 'test-product-id',
          quantity: 1,
          price: 100.00
        }
      ],
      shippingAddress: {
        full_name: 'Test User',
        street_address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pin_code: '123456',
        phone_number: '9876543210'
      }
    };

    console.log('1. Testing checkout API with test data...');
    
    // Make request to checkout API
    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCheckoutData)
    });

    const result = await response.json();
    
    console.log('2. Checkout API Response:', {
      status: response.status,
      success: result.success,
      error: result.error,
      development_mode: result.development_mode,
      order_id: result.order?.id
    });

    if (response.status === 400 && result.error?.includes('profile not found')) {
      console.error('FAIL: Profile auto-creation is not working');
      console.error('Error details:', result);
    } else if (result.success) {
      console.log('SUCCESS: Checkout completed without profile errors');
      
      // Check if profile was created
      console.log('3. Checking if profile was created in database...');
      
      // Note: This would require authentication to check properly
      console.log('Note: Profile verification requires user authentication');
      
    } else {
      console.log('PARTIAL: API responded but with different issues');
      console.log('Response:', result);
    }

  } catch (error) {
    console.error('ERROR: Test failed with exception:', error.message);
  }
  
  console.log('=== Test Complete ===');
}

// Run the test
testCheckoutProfileCreation().catch(console.error);
