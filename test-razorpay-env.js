// Test script to verify Razorpay environment variables
// Run this with: node test-razorpay-env.js

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

console.log('=== Razorpay Environment Test ===');
console.log('');

// Check environment variables
const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

console.log('Environment Variables Status:');
console.log(`- Key ID exists: ${!!keyId}`);
console.log(`- Key Secret exists: ${!!keySecret}`);
console.log(`- Key ID length: ${keyId?.length || 0}`);
console.log(`- Key Secret length: ${keySecret?.length || 0}`);
console.log('');

// Validate format
if (keyId) {
  console.log('Key ID Analysis:');
  console.log(`- Starts with rzp_test_ or rzp_live_: ${keyId.match(/^rzp_(test|live)_/) ? 'YES' : 'NO'}`);
  console.log(`- Contains placeholder text: ${keyId.includes('your_razorpay') ? 'YES' : 'NO'}`);
  console.log(`- First 8 chars: ${keyId.substring(0, 8)}...`);
  console.log('');
}

if (keySecret) {
  console.log('Key Secret Analysis:');
  console.log(`- Length >= 20 chars: ${keySecret.length >= 20 ? 'YES' : 'NO'}`);
  console.log(`- Contains placeholder text: ${keySecret.includes('your_razorpay') ? 'YES' : 'NO'}`);
  console.log(`- First 8 chars: ${keySecret.substring(0, 8)}...`);
  console.log('');
}

// Overall validation
const isValid = keyId && keySecret && 
               !keyId.includes('your_razorpay') && 
               !keySecret.includes('your_razorpay') &&
               keyId.match(/^rzp_(test|live)_/) &&
               keyId.length >= 15 && keyId.length <= 50 &&
               keySecret.length >= 20;

console.log('=== VALIDATION RESULT ===');
console.log(`Status: ${isValid ? 'VALID' : 'INVALID'}`);

if (!isValid) {
  console.log('');
  console.log('Issues found:');
  if (!keyId) console.log('- Missing NEXT_PUBLIC_RAZORPAY_KEY_ID');
  if (!keySecret) console.log('- Missing RAZORPAY_KEY_SECRET');
  if (keyId && keyId.includes('your_razorpay')) console.log('- Key ID is still placeholder text');
  if (keySecret && keySecret.includes('your_razorpay')) console.log('- Key Secret is still placeholder text');
  if (keyId && !keyId.match(/^rzp_(test|live)_/)) console.log('- Key ID format is invalid (should start with rzp_test_ or rzp_live_)');
  if (keyId && (keyId.length < 15 || keyId.length > 50)) console.log('- Key ID length is invalid');
  if (keySecret && keySecret.length < 20) console.log('- Key Secret length is invalid');
  
  console.log('');
  console.log('To fix:');
  console.log('1. Create or update your .env.local file');
  console.log('2. Add your actual Razorpay keys from https://dashboard.razorpay.com/');
  console.log('3. Restart your development server with: npm run dev');
} else {
  console.log('Razorpay environment is properly configured!');
}

console.log('');
console.log('=== Available Environment Variables ===');
const razorpayVars = Object.keys(process.env).filter(key => key.includes('RAZORPAY'));
if (razorpayVars.length > 0) {
  razorpayVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`- ${varName}: ${value ? 'SET' : 'MISSING'}`);
  });
} else {
  console.log('No RAZORPAY environment variables found');
}
