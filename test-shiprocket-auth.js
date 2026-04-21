// Test Shiprocket authentication
const { shiprocketService } = require('./src/lib/shiprocket.ts');

async function testAuth() {
  try {
    console.log('🔐 Testing Shiprocket authentication...');
    
    // This will test if the credentials work
    const token = await shiprocketService.authenticate();
    
    console.log('✅ Authentication successful!');
    console.log('📧 Token received (first 20 chars):', token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Check if Shiprocket credentials are correct');
    console.log('2. Verify Shiprocket account is active');
    console.log('3. Check internet connection');
    console.log('4. Restart your development server');
  }
}

testAuth();
