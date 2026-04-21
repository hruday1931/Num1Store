const fs = require('fs');
const path = require('path');

// Read the existing .env.local file
const envPath = path.join(__dirname, '.env.local');
const backupPath = path.join(__dirname, '.env.local.backup');

try {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Current .env.local content:');
    console.log(content);
    console.log('\n=== Analysis ===');
    
    const lines = content.split('\n');
    const razorpayLines = lines.filter(line => line.includes('RAZORPAY'));
    console.log('Razorpay lines found:', razorpayLines.length);
    razorpayLines.forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
    // Check for common issues
    console.log('\n=== Issues ===');
    if (content.includes('\r\n')) {
      console.log('- Contains Windows line endings (\\r\\n)');
    }
    if (content.includes('"')) {
      console.log('- Contains quotes around values');
    }
    if (!content.includes('NEXT_PUBLIC_RAZORPAY_KEY_ID=')) {
      console.log('- Missing NEXT_PUBLIC_RAZORPAY_KEY_ID');
    }
    if (!content.includes('RAZORPAY_KEY_SECRET=')) {
      console.log('- Missing RAZORPAY_KEY_SECRET');
    }
    
  } else {
    console.log('.env.local file does not exist');
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}
