// Test script to verify checkout API with proper data
// Run this while the dev server is running

async function testCheckoutWithAddress() {
  try {
    console.log('=== TESTING CHECKOUT API WITH ADDRESS ===');
    
    const testData = {
      amount: 10000,
      currency: 'INR',
      cartItems: [
        {
          productId: 'test-product-id',
          quantity: 1,
          price: 100
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
    
    console.log('\n1. Testing with complete data but no auth...');
    const response1 = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Status:', response1.status);
    console.log('Headers:', Object.fromEntries(response1.headers.entries()));
    
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log('Error Response:', errorText);
    } else {
      const data = await response1.json();
      console.log('Response:', data);
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testCheckoutWithAddress();
