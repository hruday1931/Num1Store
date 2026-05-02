/**
 * Test script to demonstrate vendor pickup location registration
 * Run this with: node test-vendor-pickup-registration.js
 */

const { registerVendorPickupLocation } = require('./src/lib/vendor-utils.ts');

async function testPickupLocationRegistration() {
  console.log('Testing vendor pickup location registration...\n');

  // Test data for a vendor profile update
  const vendorData = {
    vendor_id: 'test-vendor-123',
    store_name: 'Test Electronics Store',
    phone_number: '+919876543210',
    user_id: 'user-123',
    pickup_address: {
      address: '123 Commercial Street',
      address_2: 'Shop No. 45, First Floor',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pin_code: '400001'
    }
  };

  try {
    console.log('Vendor Data:', JSON.stringify(vendorData, null, 2));
    console.log('\nAttempting to register pickup location in Shiprocket...\n');

    const result = await registerVendorPickupLocation(vendorData);

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Pickup location registration successful!');
      console.log(`📍 Pickup Location ID: ${result.pickupLocationId}`);
      console.log('\n📝 Next steps:');
      console.log('1. Log in to Shiprocket dashboard');
      console.log('2. Go to Settings > Pickup Addresses');
      console.log('3. Add the pickup location manually using the provided details');
      console.log('4. Activate the pickup location using the toggle button');
    } else {
      console.log('\n❌ Pickup location registration failed');
      console.log(`Error: ${result.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test API endpoint directly
async function testVendorUpdateAPI() {
  console.log('\n\nTesting vendor update API endpoint...\n');

  const updateData = {
    vendor_id: 'test-vendor-123',
    store_name: 'Updated Electronics Store',
    phone_number: '+919876543210',
    pickup_address: {
      address: '456 Updated Street',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      pin_code: '110001'
    },
    register_pickup_location: true
  };

  try {
    const response = await fetch('http://localhost:3000/api/vendors/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ Vendor update API test successful!');
    } else {
      console.log('\n❌ Vendor update API test failed');
    }
  } catch (error) {
    console.error('❌ API test failed with error:', error);
  }
}

// Run tests
async function runTests() {
  await testPickupLocationRegistration();
  await testVendorUpdateAPI();
}

// Check if this script is being run directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testPickupLocationRegistration,
  testVendorUpdateAPI
};
