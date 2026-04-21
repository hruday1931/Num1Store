// Run this script to check your Supabase configuration
const fs = require('fs');
const https = require('https');

console.log('=== Supabase Configuration Checker ===\n');

// Read environment file
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  const env = {};
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Environment Variables:');
  console.log('URL:', url);
  console.log('Key exists:', !!key);
  console.log('Key length:', key?.length);
  console.log('');

  if (!url || !key) {
    console.log('ERROR: Missing environment variables');
    console.log('Please ensure both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
    process.exit(1);
  }

  // Check if URL looks like a placeholder
  if (url.includes('abcdefgh123456') || url.includes('your-project-id')) {
    console.log('ERROR: You are using placeholder credentials');
    console.log('The URL contains placeholder text that is not a real Supabase project.');
    console.log('');
    console.log('TO FIX THIS:');
    console.log('1. Go to https://supabase.com');
    console.log('2. Sign in and select your project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy the real Project URL and anon key');
    console.log('5. Update your .env.local file with the real credentials');
    console.log('');
    console.log('Example of what your .env.local should contain:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-real-project-id.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    process.exit(1);
  }

  // Test URL validity
  try {
    const urlObj = new URL(url);
    console.log('URL Analysis:');
    console.log('Hostname:', urlObj.hostname);
    console.log('Protocol:', urlObj.protocol);
    console.log('');

    // Test DNS resolution
    console.log('Testing DNS resolution...');
    const { lookup } = require('dns').promises;
    
    lookup(urlObj.hostname)
      .then(addresses => {
        console.log('DNS resolution successful:', addresses);
        console.log('');
        console.log('Testing HTTP connection...');
        
        // Test HTTP connection
        const options = {
          hostname: urlObj.hostname,
          port: 443,
          path: '/rest/v1/',
          method: 'GET',
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key
          }
        };

        const req = https.request(options, (res) => {
          console.log('HTTP Status:', res.statusCode);
          console.log('Response OK:', res.ok);
          
          if (res.ok) {
            console.log('');
            console.log('SUCCESS: Supabase connection is working!');
            console.log('Your authentication should work now.');
          } else {
            console.log('');
            console.log('ISSUE: HTTP error but connection works');
            console.log('Status:', res.statusCode, res.statusText);
          }
        });

        req.on('error', (e) => {
          console.log('');
          console.log('ERROR: HTTP connection failed');
          console.log('Error:', e.message);
          console.log('');
          console.log('This could mean:');
          console.log('1. Your anon key is invalid');
          console.log('2. Your Supabase project is not active');
          console.log('3. Network connectivity issues');
        });

        req.end();
      })
      .catch(err => {
        console.log('');
        console.log('ERROR: DNS resolution failed');
        console.log('Error:', err.message);
        console.log('');
        console.log('This means the hostname does not exist.');
        console.log('Please check that your Supabase URL is correct.');
      });

  } catch (err) {
    console.log('ERROR: Invalid URL format');
    console.log('Error:', err.message);
  }

} catch (err) {
  console.log('ERROR: Could not read .env.local file');
  console.log('Error:', err.message);
}
