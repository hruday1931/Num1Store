const fs = require('fs');
const path = require('path');

// Read the existing .env.local file
const envPath = path.join(__dirname, '.env.local');

try {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Current content:');
    console.log(JSON.stringify(content));
    
    // Fix the formatting by removing extra line breaks and spaces
    const fixedContent = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\s*=\s*/g, '=') // Remove spaces around equals
      .replace(/(\w+)=/g, '\n$1=') // Add newline before each variable
      .replace(/^\n/, '') // Remove leading newline
      .trim();
    
    console.log('\nFixed content:');
    console.log(fixedContent);
    
    // Write the fixed content back
    fs.writeFileSync(envPath, fixedContent);
    console.log('\nEnvironment file fixed successfully!');
  } else {
    console.log('.env.local file does not exist');
  }
} catch (error) {
  console.error('Error fixing .env.local:', error.message);
}
