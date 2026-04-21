// Test script to verify checkout API authentication
// Run this while the dev server is running

async function testCheckoutAuth() {
  try {
    console.log('=== TESTING CHECKOUT API AUTHENTICATION ===');
    
    // Test 1: Call checkout API without authentication
    console.log('\n1. Testing without authentication...');
    const response1 = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 10000,
        currency: 'INR',
        cartItems: [],
        shippingAddress: null
      })
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
    
    // Test 2: Check if user is signed in by visiting a protected page
    console.log('\n2. Testing user session...');
    const response2 = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sb-access-token=test; sb-refresh-token=test' // Simulate session
      },
      body: JSON.stringify({
        amount: 10000,
        currency: 'INR',
        cartItems: [],
        shippingAddress: null
      })
    });
    
    console.log('Status with cookies:', response2.status);
    
    if (!response2.ok) {
      const errorText = await response2.text();
      console.log('Error Response with cookies:', errorText);
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testCheckoutAuth();
