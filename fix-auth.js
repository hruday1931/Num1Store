#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Authentication Fix Tool ===\n');

const envPath = path.join(__dirname, '.env.local');

// Read current env file
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Check for placeholder values
const hasPlaceholderUrl = envContent.includes('your-project-id.supabase.co');
const hasPlaceholderKey = envContent.includes('your-supabase-anon-key');

if (hasPlaceholderUrl || hasPlaceholderKey) {
  console.log('❌ Found placeholder Supabase values in .env.local\n');
  
  console.log('🔧 QUICK FIX STEPS:\n');
  console.log('1. Open your browser and go to: https://supabase.com/dashboard');
  console.log('2. Create a new project or select an existing one');
  console.log('3. Go to Settings → API in your project');
  console.log('4. Copy the "Project URL" (looks like: https://abcdefg.supabase.co)');
  console.log('5. Copy the "anon" public key (long string starting with eyJhbGciOiJIUzI1NiIs...)\n');
  
  console.log('6. Now edit your .env.local file and replace:\n');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('   WITH:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co\n');
  
  console.log('   AND:');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.log('   WITH:');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key\n');
  
  console.log('7. Save the file and restart: npm run dev\n');
  
  console.log('💡 TIP: I\'ve created env-template.txt with examples of what real values look like.\n');
  
  // Show current problematic lines
  const lines = envContent.split('\n');
  console.log('Current values that need to be replaced:');
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL') && line.includes('your-project-id')) {
      console.log(`❌ ${line}`);
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY') && line.includes('your-supabase-anon-key')) {
      console.log(`❌ ${line}`);
    }
  });
  
} else {
  console.log('✅ Supabase environment variables look correct!\n');
  console.log('If you still have issues, check:');
  console.log('• Your Supabase project is active and not paused');
  console.log('• The anon key is correct');
  console.log('• No firewall is blocking the connection');
  console.log('• Your internet connection is working\n');
}

console.log('=== Common Error Messages ===\n');
console.log('"Failed to fetch" → Environment variables are placeholders');
console.log('"Invalid login credentials" → Wrong email/password');
console.log('"Email not confirmed" → Check email for verification link');
console.log('"AuthRetryableFetchError" → Network connectivity issue\n');

console.log('Need help? Check env-template.txt for examples of real values.');
