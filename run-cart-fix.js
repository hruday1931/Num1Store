const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value;
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testTables() {
  try {
    console.log('Testing cart and wishlist tables...');
    
    // Test cart table
    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('*')
      .limit(1);
    
    if (cartError) {
      console.log('Cart table test failed:', cartError.message);
    } else {
      console.log('Cart table exists and is accessible');
    }
    
    // Test wishlist table
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .limit(1);
    
    if (wishlistError) {
      console.log('Wishlist table test failed:', wishlistError.message);
    } else {
      console.log('Wishlist table exists and is accessible');
    }
    
    if (cartError || wishlistError) {
      console.log('\nPlease run the SQL script in fix-cart-wishlist.sql in your Supabase SQL Editor');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy the contents of fix-cart-wishlist.sql');
      console.log('4. Run the script');
    } else {
      console.log('All tables are working correctly!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTables();
