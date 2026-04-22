const fs = require('fs');
const path = require('path');

console.log('=== Fixing Supabase Environment Variables ===\n');

const envPath = path.join(__dirname, '.env.local');

try {
  // Read existing content
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
    console.log('✓ Read existing .env.local file');
  }

  // Check if Supabase variables already exist
  const hasUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const hasAnonKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');

  if (!hasUrl || !hasAnonKey) {
    // Add Supabase variables at the beginning
    const supabaseVars = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

`;

    // Remove any existing Supabase variables to avoid duplicates
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => 
      !line.includes('NEXT_PUBLIC_SUPABASE_URL=') &&
      !line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') &&
      !line.includes('SUPABASE_SERVICE_ROLE_KEY=') &&
      !line.includes('# Supabase Configuration')
    );

    const filteredContent = filteredLines.join('\n');
    
    // Combine Supabase vars with existing content
    const newContent = supabaseVars + filteredContent;

    // Write back to file
    fs.writeFileSync(envPath, newContent, 'utf8');
    console.log('✓ Added Supabase environment variables to .env.local');
    console.log('\n⚠️  IMPORTANT: You must update the placeholder values:');
    console.log('1. NEXT_PUBLIC_SUPABASE_URL - Get from your Supabase project settings');
    console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY - Get from your Supabase project settings');
    console.log('3. SUPABASE_SERVICE_ROLE_KEY - Optional, for admin operations');
    console.log('\nReplace "your-project.supabase.co" and "your_supabase_anon_key" with real values');
  } else {
    console.log('✓ Supabase environment variables already exist');
  }

  // Verify the fix
  const updatedContent = fs.readFileSync(envPath, 'utf8');
  const nowHasUrl = updatedContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const nowHasAnonKey = updatedContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  
  console.log('\n=== Verification ===');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${nowHasUrl ? '✓' : '✗'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${nowHasAnonKey ? '✓' : '✗'}`);

} catch (error) {
  console.error('Error fixing .env.local:', error.message);
}

console.log('\n=== Fix Complete ===');
