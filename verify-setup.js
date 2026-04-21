require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verifying Shiprocket setup...\n');

// Check environment variables
const email = process.env.SHIPROCKET_EMAIL;
const password = process.env.SHIPROCKET_PASSWORD;

console.log('📧 Shiprocket Email:', email ? '✅ Set' : '❌ Missing');
console.log('🔐 Shiprocket Password:', password ? '✅ Set' : '❌ Missing');

if (email && password) {
  console.log('\n✅ Environment variables are configured correctly!');
  console.log('📧 Email:', email);
  console.log('🔐 Password: [HIDDEN FOR SECURITY]');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Go to vendor orders page');
  console.log('3. Test the "Ship Order" functionality');
  
} else {
  console.log('\n❌ Environment variables are missing!');
  console.log('💡 Run: node setup-shiprocket-credentials.js');
}
