const fs = require('fs');
const path = require('path');

// Shiprocket credentials
const SHIPROCKET_EMAIL = 'num1olinestore@gmail.com';
const SHIPROCKET_PASSWORD = 'sjVmy3RRetC4mmvKan7H1&97z&j9*AJB';

// Path to .env.local file
const envPath = path.join(__dirname, '.env.local');

// Read existing .env.local file or create new content
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Update or add Shiprocket credentials
const shiprocketEmailLine = `SHIPROCKET_EMAIL=${SHIPROCKET_EMAIL}`;
const shiprocketPasswordLine = `SHIPROCKET_PASSWORD=${SHIPROCKET_PASSWORD}`;

// Remove existing Shiprocket lines if they exist
const lines = envContent.split('\n');
const filteredLines = lines.filter(line => 
  !line.startsWith('SHIPROCKET_EMAIL=') && 
  !line.startsWith('SHIPROCKET_PASSWORD=')
);

// Add new Shiprocket credentials
filteredLines.push(shiprocketEmailLine);
filteredLines.push(shiprocketPasswordLine);

// Write back to .env.local
fs.writeFileSync(envPath, filteredLines.join('\n'), 'utf8');

console.log('✅ Shiprocket credentials added to .env.local successfully!');
console.log('📧 Email:', SHIPROCKET_EMAIL);
console.log('🔐 Password: [HIDDEN FOR SECURITY]');
console.log('');
console.log('🚀 You can now test the Shiprocket integration!');
console.log('💡 Make sure to restart your development server.');
