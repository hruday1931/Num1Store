#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('=== Supabase Environment Check ===\n');

// Read current .env.local file
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env.local file found.\n');
} else {
  console.log('❌ .env.local file not found.\n');
  console.log('Please create a .env.local file with your Supabase credentials.\n');
  process.exit(1);
}

// Check if placeholder values exist
const hasPlaceholderUrl = envContent.includes('your-project-id') || envContent.includes('your_supabase_url');
const hasPlaceholderKey = envContent.includes('your-supabase-anon-key') || envContent.includes('your_supabase_anon_key');

if (hasPlaceholderUrl || hasPlaceholderKey) {
  console.log('❌ ISSUE DETECTED: Placeholder Supabase values found in .env.local\n');
  console.log('To fix this issue:\n');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Navigate to Settings → API');
  console.log('4. Copy the "Project URL" and "anon" public key\n');
  console.log('5. Update your .env.local file with:\n');
  
  const exampleEnv = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here`;
  
  console.log(exampleEnv);
  console.log('\n6. Restart your development server: npm run dev\n');
  console.log('The "your-project-id" and "your-supabase-anon-key" are just placeholders!');
  console.log('Replace them with your actual Supabase project credentials.\n');
  process.exit(1);
} else {
  console.log('✅ Supabase environment variables appear to be configured correctly.\n');
  console.log('Current environment variables (showing first 50 chars):');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL')) {
      console.log(`${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      console.log(`${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
    }
  });
  console.log('\nIf you are still experiencing issues, please check:');
  console.log('- Your Supabase project is active');
  console.log('- The anon key is correct');
  console.log('- Your internet connection is working');
  console.log('- No firewall is blocking the connection\n');
}

console.log('=== Troubleshooting Tips ===\n');
console.log('Common issues and solutions:');
console.log('1. "Failed to fetch" → Environment variables are still placeholders');
console.log('2. "Invalid login credentials" → Email/password are incorrect');
console.log('3. "Email not confirmed" → Check your email for verification link');
console.log('4. Network issues → Check internet connection and firewall\n');
