const fs = require('fs');
const path = require('path');

// Shiprocket credentials
const SHIPROCKET_EMAIL = 'num1olinestore@gmail.com';
const SHIPROCKET_PASSWORD = 'sjVmy3RRetC4mmvKan7H1&97z&j9*AJB';

// Path to .env.local file
const envPath = path.join(__dirname, '.env.local');

// Read existing .env.local file or create new one
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Check if Shiprocket variables already exist
const hasEmail = envContent.includes('SHIPROCKET_EMAIL=');
const hasPassword = envContent.includes('SHIPROCKET_PASSWORD=');

// Add Shiprocket variables if they don't exist
if (!hasEmail) {
  envContent += `\n# Shiprocket API Credentials\nSHIPROCKET_EMAIL=${SHIPROCKET_EMAIL}\n`;
}

if (!hasPassword) {
  envContent += `SHIPROCKET_PASSWORD=${SHIPROCKET_PASSWORD}\n`;
}

// Check if NEXT_PUBLIC_APP_URL exists
if (!envContent.includes('NEXT_PUBLIC_APP_URL=')) {
  // Default to localhost for development
  envContent += `\n# App URL for Shiprocket callbacks\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n`;
}

// Write back to .env.local
fs.writeFileSync(envPath, envContent);

console.log('✅ Shiprocket environment variables configured successfully!');
console.log('📝 Added to .env.local:');
console.log(`   - SHIPROCKET_EMAIL=${SHIPROCKET_EMAIL}`);
console.log(`   - SHIPROCKET_PASSWORD=***`);
if (!envContent.includes('NEXT_PUBLIC_APP_URL=')) {
  console.log(`   - NEXT_PUBLIC_APP_URL=http://localhost:3000`);
}
console.log('\n🚀 You can now use Shiprocket integration in your Num1Store!');
