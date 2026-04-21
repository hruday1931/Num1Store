// Test script to verify Shiprocket API connection
const { shiprocketService } = require('./src/lib/shiprocket.ts');

async function testShiprocketConnection() {
  console.log('Testing Shiprocket API connection...');
  
  try {
    // Test authentication
    console.log('1. Testing authentication...');
    const token = await shiprocketService.authenticate();
    console.log('✅ Authentication successful');
    console.log('Token length:', token.length);
    
    // Test API call - get available couriers
    console.log('\n2. Testing API call...');
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/courier/serviceability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        pickup_postcode: "400001",
        delivery_postcode: "400050",
        cod: true,
        weight: 0.5
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('Available couriers:', data.data?.length || 0);
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check SHIPROCKET_EMAIL environment variable');
      console.log('2. Check SHIPROCKET_PASSWORD environment variable');
      console.log('3. Verify Shiprocket account is active');
      console.log('4. Check if API access is enabled in Shiprocket dashboard');
    }
  }
}

// Check environment variables
console.log('Checking environment variables...');
console.log('SHIPROCKET_EMAIL:', process.env.SHIPROCKET_EMAIL ? '✅ Set' : '❌ Missing');
console.log('SHIPROCKET_PASSWORD:', process.env.SHIPROCKET_PASSWORD ? '✅ Set' : '❌ Missing');

if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
  testShiprocketConnection();
} else {
  console.log('\n❌ Environment variables not set. Please check your .env.local file.');
}
