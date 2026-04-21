// Test script to verify environment variables are being read correctly
// Run with: node test-env-check.js

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

console.log('=== ENVIRONMENT VARIABLE TEST ===');
console.log('');

// Check Razorpay variables
const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('Razorpay Environment Variables:');
console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', {
  exists: !!razorpayKeyId,
  value: razorpayKeyId ? razorpayKeyId.substring(0, 8) + '...' : 'missing',
  length: razorpayKeyId ? razorpayKeyId.length : 0,
  isPlaceholder: razorpayKeyId?.includes('your_razorpay') || false
});

console.log('RAZORPAY_KEY_SECRET:', {
  exists: !!razorpayKeySecret,
  value: razorpayKeySecret ? razorpayKeySecret.substring(0, 8) + '...' : 'missing',
  length: razorpayKeySecret ? razorpayKeySecret.length : 0,
  isPlaceholder: razorpayKeySecret?.includes('your_razorpay') || false
});

console.log('');
console.log('All RAZORPAY environment variables:');
const razorpayVars = Object.keys(process.env).filter(key => key.includes('RAZORPAY'));
razorpayVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`, value ? `${value.substring(0, 8)}... (${value.length} chars)` : 'missing');
});

console.log('');
console.log('=== DIAGNOSIS ===');

if (!razorpayKeyId || !razorpayKeySecret) {
  console.log('ERROR: Razorpay environment variables are missing');
} else if (razorpayKeyId.includes('your_razorpay') || razorpayKeySecret.includes('your_razorpay')) {
  console.log('ERROR: You are using placeholder values instead of real Razorpay credentials');
  console.log('');
  console.log('TO FIX:');
  console.log('1. Get real Razorpay credentials from https://dashboard.razorpay.com/');
  console.log('2. Update your .env.local file with actual values');
  console.log('3. Restart your development server');
} else {
  console.log('SUCCESS: Razorpay environment variables appear to be properly configured');
}

console.log('');
console.log('=== END TEST ===');
