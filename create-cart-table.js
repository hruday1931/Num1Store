const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value;
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function createCartTable() {
  try {
    console.log('Testing cart table...');
    
    // First, try to select from the cart table to see if it exists
    const { data, error: testError } = await supabase
      .from('cart')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('Cart table does not exist or has permission issues:', testError.message);
      console.log('\nPlease manually run the following SQL in your Supabase SQL Editor:');
      console.log(`
-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Create policies for cart
CREATE POLICY IF NOT EXISTS "Users can view own cart" ON cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own cart" ON cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own cart" ON cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own cart" ON cart FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
      `);
    } else {
      console.log('Cart table exists and is working correctly!');
      console.log('Cart data:', data);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createCartTable();
