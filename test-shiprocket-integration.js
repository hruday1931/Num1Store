// Test script to verify Shiprocket integration
// Run with: node test-shiprocket-integration.js

const { shiprocketService } = require('./src/lib/shiprocket.ts');

async function testShiprocketIntegration() {
  console.log('Testing Shiprocket Integration...');
  
  try {
    // Test authentication
    console.log('1. Testing authentication...');
    const token = await shiprocketService.authenticate();
    console.log('✅ Authentication successful');
    
    // Test sample shipment data
    console.log('2. Testing shipment data conversion...');
    const sampleOrder = {
      id: 'test-order-123',
      created_at: new Date().toISOString(),
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '9876543210',
      address: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      payment_method: 'COD',
      total_amount: 299.99
    };
    
    const sampleOrderItems = [
      {
        name: 'Test Product',
        quantity: 1,
        price: 299.99,
        weight: 0.5,
        length: 10,
        breadth: 10,
        height: 5
      }
    ];
    
    const shipmentData = shiprocketService.constructor.convertOrderToShipment(sampleOrder, sampleOrderItems);
    console.log('✅ Shipment data conversion successful');
    console.log('Shipment data:', JSON.stringify(shipmentData, null, 2));
    
    console.log('\n🎉 Shiprocket integration test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Ensure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are set in your .env file');
    console.log('2. Test the complete flow from vendor orders page');
    console.log('3. Verify pickup requests are generated automatically');
    console.log('4. Check tracking updates on the order tracking page');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are set correctly');
    console.error('2. Verify Shiprocket account is active and approved');
    console.error('3. Check network connectivity');
  }
}

testShiprocketIntegration();
