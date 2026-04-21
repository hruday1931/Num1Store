// Script to update .env.local with real Supabase credentials
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Supabase Credentials Updater ===\n');
console.log('This script will help you update your .env.local file with real Supabase credentials.\n');

rl.question('Enter your Supabase Project URL (e.g., https://your-project-id.supabase.co): ', (url) => {
  rl.question('Enter your Supabase Anon Key: ', (key) => {
    
    // Validate inputs
    if (!url || !key) {
      console.log('ERROR: Both URL and key are required');
      rl.close();
      return;
    }

    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      console.log('ERROR: Invalid URL format. Should be like: https://your-project-id.supabase.co');
      rl.close();
      return;
    }

    if (key.length < 50) {
      console.log('WARNING: Anon key seems too short. Please double-check it.');
    }

    // Create new .env.local content
    const content = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\n`;

    try {
      fs.writeFileSync('.env.local', content, 'utf8');
      console.log('\nSUCCESS: .env.local has been updated with your real Supabase credentials!');
      console.log('Please restart your dev server with: npm run dev');
      console.log('Then try signing in again.\n');
      
      // Test the new configuration
      console.log('Testing new configuration...');
      const { testSupabaseConnection } = require('./src/lib/supabase-test.js');
      
      // Set environment variables for testing
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
      
      testSupabaseConnection().then(result => {
        if (result.success) {
          console.log('Connection test PASSED! Your authentication should work now.');
        } else {
          console.log('Connection test FAILED:', result.error);
          console.log('Please double-check your credentials and try again.');
        }
        rl.close();
      });
      
    } catch (err) {
      console.log('ERROR: Could not update .env.local:', err.message);
      rl.close();
    }
  });
});
