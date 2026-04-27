// Test script to verify Razorpay integration
const testCheckout = async () => {
  console.log('🧪 Testing Razorpay Integration...');
  
  try {
    // Test the checkout API endpoint
    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper auth, but we can see the error
      },
      body: JSON.stringify({
        amount: 10000, // ₹100 in paise
        currency: 'INR',
        shippingAddress: {
          street_address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pin_code: '123456',
          phone_number: '1234567890'
        }
      })
    });
    
    const data = await response.json();
    console.log('📡 API Response:', data);
    console.log('✅ Status:', response.status);
    
    if (data.success) {
      console.log('✅ Order created successfully');
      console.log('🆔 Order ID:', data.order?.id);
      console.log('💰 Amount:', data.order?.amount);
      console.log('🪙 Currency:', data.order?.currency);
    } else {
      console.log('❌ Order creation failed');
      console.log('🚨 Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testCheckout();
