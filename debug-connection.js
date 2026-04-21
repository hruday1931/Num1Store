// Debug script to test Supabase connection step by step
const fs = require('fs');

// Read environment variables from .env.local
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    const env = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
    return {};
  }
}

async function testConnection() {
  console.log('=== Supabase Connection Debug ===\n');
  
  // Load environment
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('1. Environment Variables:');
  console.log('   URL:', url);
  console.log('   Key exists:', !!key);
  console.log('   Key length:', key?.length);
  console.log('   Key starts with eyJ:', key?.startsWith('eyJ'));
  
  if (!url || !key) {
    console.log('\n❌ Missing environment variables');
    return;
  }
  
  // Clean URL
  const cleanUrl = url.replace(/\s+/g, '');
  const cleanKey = key.replace(/\s+/g, '');
  
  console.log('\n2. Cleaned Variables:');
  console.log('   Clean URL:', cleanUrl);
  console.log('   Clean Key length:', cleanKey.length);
  
  // Test URL format
  try {
    const urlObj = new URL(cleanUrl);
    console.log('\n3. URL Validation:');
    console.log('   ✅ Valid URL format');
    console.log('   Hostname:', urlObj.hostname);
    console.log('   Protocol:', urlObj.protocol);
  } catch (error) {
    console.log('\n❌ Invalid URL format:', error.message);
    return;
  }
  
  // Test basic connectivity
  console.log('\n4. Testing HTTP Connection...');
  try {
    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('\n✅ Connection successful!');
    } else {
      console.log('\n❌ Connection failed');
      
      // Try without auth to see if project exists
      console.log('\n5. Testing project existence (no auth)...');
      try {
        const noAuthResponse = await fetch(`${cleanUrl}/`, {
          method: 'GET'
        });
        console.log('   No-auth status:', noAuthResponse.status);
        
        if (noAuthResponse.status === 404) {
          console.log('   ❌ Project does not exist or URL is wrong');
        } else if (noAuthResponse.status === 200) {
          console.log('   ✅ Project exists, issue is with authentication');
        }
      } catch (error) {
        console.log('   Error testing project:', error.message);
      }
    }
    
  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

testConnection();
