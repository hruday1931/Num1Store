// Debug Next.js environment variables
console.log('=== Next.js Environment Debug ===');
console.log('');

// Check all environment variables that start with NEXT_PUBLIC_
const nextPublicVars = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'));
console.log('NEXT_PUBLIC_ variables found:');
nextPublicVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`- ${varName}: ${value ? 'SET (' + value.length + ' chars)' : 'MISSING'}`);
  if (varName.includes('RAZORPAY') && value) {
    console.log(`  First 8 chars: ${value.substring(0, 8)}...`);
  }
});

console.log('');
console.log('All RAZORPAY variables:');
const razorpayVars = Object.keys(process.env).filter(key => key.includes('RAZORPAY'));
razorpayVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`- ${varName}: ${value ? 'SET (' + value.length + ' chars)' : 'MISSING'}`);
  if (value) {
    console.log(`  First 8 chars: ${value.substring(0, 8)}...`);
  }
});

console.log('');
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
