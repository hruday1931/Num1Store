const fs = require('fs');
const path = require('path');

// Fix the .env.local file
const envPath = path.join(__dirname, '.env.local');

const correctContent = `NEXT_PUBLIC_SUPABASE_URL=https://ukipceixpshplkdinkre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVraXBjZWl4cHNocGxrZGlua3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDQwMDksImV4cCI6MjA5MTU4MDAwOX0.XP4RFygs0jdS27FQMdXI855A_IB89TVnczORUG29I0Y
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_SeWufGPIAf09h5
RAZORPAY_KEY_SECRET=VeAeFrjGPpjC3V2ZZCPtY8LQ`;

try {
  fs.writeFileSync(envPath, correctContent, 'utf8');
  console.log('✅ .env.local file has been fixed!');
  console.log('');
  console.log('Fixed content:');
  console.log(correctContent);
} catch (error) {
  console.error('❌ Error fixing .env.local:', error.message);
}
