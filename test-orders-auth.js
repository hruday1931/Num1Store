// Test script to verify orders page authentication flow
// Run this to debug authentication issues

console.log('=== Orders Authentication Test ===');

// Check if environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.log('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('All required environment variables are present.');

// Instructions for manual testing
console.log('\n=== Manual Testing Instructions ===');
console.log('1. Start your development server: npm run dev');
console.log('2. Sign in to your application');
console.log('3. Navigate to /orders page');
console.log('4. Check the browser console for any errors');
console.log('5. Check the Network tab for failed requests');

console.log('\n=== What to Check ===');
console.log('1. Middleware logs in terminal (should show session info)');
console.log('2. Auth context logs in browser console');
console.log('3. Network requests to Supabase API');
console.log('4. Any RLS policy errors in Supabase logs');

console.log('\n=== Debug Steps ===');
console.log('If still redirected to sign-in:');
console.log('1. Clear browser cookies and localStorage');
console.log('2. Sign in again');
console.log('3. Try accessing /orders again');
console.log('4. Check browser dev tools for authentication state');
