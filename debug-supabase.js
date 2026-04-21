const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Found .env.local file');
} catch (error) {
  console.log('Could not read .env.local file:', error.message);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

if (supabaseUrl) {
  console.log('URL:', supabaseUrl.substring(0, 30) + '...');
}

if (supabaseAnonKey) {
  console.log('Key:', supabaseAnonKey.substring(0, 30) + '...');
}

if (supabaseUrl && supabaseAnonKey) {
  console.log('\nTesting Supabase connection...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  supabase.from('products').select('*').limit(1)
    .then(({ data, error, status }) => {
      console.log('\nTest query result:');
      console.log('Status:', status);
      console.log('Data:', data);
      console.log('Error:', error);
      
      if (error) {
        console.log('\nError details:');
        console.log('Message:', error.message);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
        console.log('Code:', error.code);
      }
    })
    .catch(err => {
      console.log('\nCatch error:', err.message);
    });
} else {
  console.log('\nMissing environment variables. Please check your .env.local file.');
}
