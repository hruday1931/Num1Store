const fs = require('fs');
const path = require('path');

console.log('=== Adding Supabase Environment Variables ===\n');

const envPath = path.join(__dirname, '.env.local');

try {
  // Read current content
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
    console.log('✓ Read existing .env.local file');
  }

  // Check if Supabase variables already exist
  const hasUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const hasAnonKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');

  if (hasUrl && hasAnonKey) {
    console.log('✓ Supabase environment variables already exist');
    process.exit(0);
  }

  // Add Supabase variables
  const supabaseVars = `
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
`;

  // Append to file
  fs.appendFileSync(envPath, supabaseVars, 'utf8');
  
  console.log('✓ Added Supabase environment variables to .env.local');
  console.log('\n⚠️  IMPORTANT: Update these placeholder values with your actual Supabase credentials:');
  console.log('1. Get your Supabase URL from your Supabase project settings');
  console.log('2. Get your anon key from your Supabase project settings');
  console.log('3. Replace "https://your-project-id.supabase.co" with your actual URL');
  console.log('4. Replace "your-supabase-anon-key" with your actual anon key');
  console.log('\nAfter updating, restart your development server');

} catch (error) {
  console.error('Error updating .env.local:', error.message);
  process.exit(1);
}

console.log('\n=== Complete ===');
