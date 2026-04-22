const fs = require('fs');
const path = require('path');

console.log('=== Supabase Environment Setup ===\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('✓ .env.local file exists');
  
  // Read and check current content
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Check for required Supabase variables
  const hasUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const hasAnonKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? '✓' : '✗ Missing'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✓' : '✗ Missing'}`);
  
  if (!hasUrl || !hasAnonKey) {
    console.log('\n⚠️  Missing required Supabase environment variables!');
    console.log('\nPlease add these lines to your .env.local file:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.log('\nReplace the placeholder values with your actual Supabase credentials.');
  } else {
    console.log('\n✓ All required Supabase environment variables are present');
  }
  
} else {
  console.log('✗ .env.local file does not exist');
  console.log('\nCreating .env.local file with template...');
  
  const template = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
`;
  
  try {
    fs.writeFileSync(envPath, template, 'utf8');
    console.log('✓ .env.local file created successfully');
    console.log('\n⚠️  IMPORTANT: Update the placeholder values with your actual Supabase credentials:');
    console.log('1. Get your Supabase URL from your Supabase project settings');
    console.log('2. Get your anon key from your Supabase project settings');
    console.log('3. Replace "your_supabase_project_url" and "your_supabase_anon_key" with real values');
  } catch (error) {
    console.error('Error creating .env.local:', error.message);
  }
}

console.log('\n=== Setup Complete ===');
