const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('Could not read .env.local file:', error.message);
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixRLS() {
  console.log('Checking RLS policies for products table...');
  
  // First, try to query without any authentication
  console.log('\n1. Testing anonymous access to products table...');
  const { data: testProducts, error: testError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
    
  if (testError) {
    console.log('Anonymous access failed:', testError);
    console.log('Error code:', testError.code);
    console.log('Error message:', testError.message);
    
    if (testError.code === '42501' || testError.message?.includes('permission denied')) {
      console.log('\nThis is an RLS permission error. The table exists but RLS is blocking access.');
      console.log('You need to run the following SQL in your Supabase SQL Editor:');
      console.log(`
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;

-- Create the correct policy for public read access
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Enable RLS on the products table (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      `);
    }
  } else {
    console.log('Anonymous access successful! Found', testProducts?.length || 0, 'products');
  }
  
  // Check if the table has the correct structure
  console.log('\n2. Checking products table structure...');
  try {
    const { data: products, error: structureError } = await supabase
      .from('products')
      .select('id, name, description, price, category, is_active')
      .limit(1);
      
    if (structureError) {
      console.log('Structure check failed:', structureError);
      if (structureError.message?.includes('column') && structureError.message?.includes('does not exist')) {
        console.log('\nMissing columns detected. The database schema needs to be applied.');
        console.log('Please run the database_schema.sql file in your Supabase SQL Editor.');
      }
    } else {
      console.log('Table structure looks correct.');
    }
  } catch (error) {
    console.log('Error checking structure:', error.message);
  }
  
  // Try to insert sample data if table is empty
  console.log('\n3. Checking if we need to insert sample data...');
  const { data: existingProducts, error: countError } = await supabase
    .from('products')
    .select('count')
    .limit(1);
    
  if (countError) {
    console.log('Could not check product count:', countError);
  } else if (!existingProducts || existingProducts.length === 0) {
    console.log('Products table is empty. You need sample data.');
    console.log('The database_schema.sql file includes sample data insertion.');
  } else {
    console.log('Products table has data.');
  }
}

checkAndFixRLS().catch(console.error);
