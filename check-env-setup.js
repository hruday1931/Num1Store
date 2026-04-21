// Environment Verification Script
// Run this with: node check-env-setup.js

console.log('=== Supabase Environment Variables Check ===\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optionalVars = [
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

let allRequiredPresent = true;
let issues = [];

console.log('Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = !!value;
  const isValid = isPresent && !value.includes('your_') && !value.includes('placeholder');
  
  console.log(`${isPresent ? 'Present' : 'MISSING'}: ${varName}`);
  
  if (!isPresent) {
    allRequiredPresent = false;
    issues.push(`${varName} is missing`);
  } else if (!isValid) {
    allRequiredPresent = false;
    issues.push(`${varName} contains placeholder value`);
  } else {
    // Show partial value for verification
    const maskedValue = varName.includes('KEY') 
      ? value.substring(0, 8) + '...' + value.substring(value.length - 8)
      : value;
    console.log(`  Value: ${maskedValue}`);
  }
});

console.log('\nOptional Variables (for payments):');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = !!value;
  const isValid = isPresent && !value.includes('your_') && !value.includes('placeholder');
  
  console.log(`${isPresent ? 'Present' : 'Missing'}: ${varName}`);
  
  if (isPresent && isValid) {
    const maskedValue = varName.includes('KEY') 
      ? value.substring(0, 8) + '...' + value.substring(value.length - 8)
      : value;
    console.log(`  Value: ${maskedValue}`);
  }
});

console.log('\n=== Summary ===');
if (allRequiredPresent) {
  console.log('All required Supabase environment variables are present!');
} else {
  console.log('Issues found:');
  issues.forEach(issue => console.log(`- ${issue}`));
  console.log('\nTo fix:');
  console.log('1. Copy env-example.txt to .env.local');
  console.log('2. Fill in your actual Supabase values');
  console.log('3. Restart your development server');
}

// Test Supabase connection if variables are present
if (allRequiredPresent) {
  console.log('\n=== Testing Supabase Connection ===');
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test connection with a simple health check
    supabase.from('profiles').select('count').limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log('Connection test failed:', error.message);
          if (error.message.includes('JWT')) {
            console.log('This might be expected if the table doesn\'t exist or has RLS policies');
          }
        } else {
          console.log('Supabase connection successful!');
        }
      })
      .catch(err => {
        console.log('Connection test error:', err.message);
      });
  } catch (error) {
    console.log('Cannot test connection - @supabase/supabase-js not installed');
  }
}
