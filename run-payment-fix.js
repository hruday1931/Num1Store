// Direct script to run the payment method column fix
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Running payment method column fix...\n');

// Read the SQL file
const sqlContent = fs.readFileSync('./add-payment-method-column.sql', 'utf8');
console.log('SQL to execute:');
console.log('='.repeat(50));
console.log(sqlContent);
console.log('='.repeat(50));

console.log('\n⚠️  MANUAL ACTION REQUIRED:');
console.log('1. Copy the SQL above');
console.log('2. Go to your Supabase project dashboard');
console.log('3. Open SQL Editor');
console.log('4. Paste and run the SQL');
console.log('5. Then try COD order again\n');

console.log('📝 Alternative: Use Supabase CLI if installed');
console.log('Run: supabase db push --schema public');

// Try to detect if supabase CLI is available
try {
  execSync('supabase --version', { stdio: 'ignore' });
  console.log('\n✅ Supabase CLI detected! You can run:');
  console.log('supabase db push --schema public');
} catch (e) {
  console.log('\n❌ Supabase CLI not found. Please use manual method.');
}
