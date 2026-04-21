// Test script for checkout API
require('dotenv').config({ path: '.env.local' });

async function testCheckoutAPI() {
  console.log('=== Testing Checkout API ===\n');
  
  try {
    // Test data
    const testData = {
      amount: 10000, // 100 rupees in paise
      currency: 'INR',
      cartItems: [
        {
          productId: 'test-product-id',
          quantity: 2,
          price: 50
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

    console.log('Sending test request to checkout API...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Response Data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('Raw Response:', responseText);
    }

    if (response.ok && responseData?.success) {
      console.log('\n=== SUCCESS ===');
      console.log('Order created successfully!');
      console.log('Order ID:', responseData.order?.id || responseData.order?.database_order_id);
      if (responseData.development_mode) {
        console.log('Note: Running in development mode (no actual payment)');
      }
    } else {
      console.log('\n=== FAILED ===');
      console.log('Error:', responseData?.error || 'Unknown error');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testCheckoutAPI();
