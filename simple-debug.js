#!/usr/bin/env node

/**
 * Simple debug script to diagnose checkout API issues
 */

const fs = require('fs');
const path = require('path');

console.log('=== SIMPLE CHECKOUT DEBUG ===\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
console.log('1. Environment Variables Check:');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ];
  
  console.log('\nRequired variables:');
  requiredVars.forEach(varName => {
    if (envContent.includes(varName + '=')) {
      const value = envContent.split('\n')
        .find(line => line.startsWith(varName + '='))
        ?.split('=')[1];
      
      if (value && value.trim() !== '' && !value.includes('your_')) {
        console.log(`✅ ${varName}: SET (${value.substring(0, 8)}...)`);
      } else {
        console.log(`❌ ${varName}: EMPTY or using placeholder`);
      }
    } else {
      console.log(`❌ ${varName}: MISSING`);
    }
  });
} else {
  console.log('❌ .env.local file does not exist');
  console.log('\n📝 Please create .env.local with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id');
  console.log('RAZORPAY_KEY_SECRET=your_razorpay_key_secret');
}

// Check package.json dependencies
console.log('\n2. Dependencies Check:');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['@supabase/supabase-js', 'razorpay'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: MISSING - run npm install ${dep}`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Check API route
console.log('\n3. API Route Check:');
const apiRoutePath = path.join(__dirname, 'src/app/api/checkout/route.ts');
if (fs.existsSync(apiRoutePath)) {
  console.log('✅ Checkout API route exists');
} else {
  console.log('❌ Checkout API route missing');
}

console.log('\n=== COMMON ISSUES & SOLUTIONS ===');
console.log('1. Missing .env.local → Create file with proper credentials');
console.log('2. Empty credentials → Replace placeholders with actual values');
console.log('3. Missing dependencies → Run npm install');
console.log('4. Expired session → Sign out and sign back in');
console.log('5. Cart empty → Add items to cart before checkout');

console.log('\n=== END DEBUG ===');
