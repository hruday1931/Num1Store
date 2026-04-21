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

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixVendorId() {
  console.log('=== VENDOR_ID COLUMN FIX ===\n');
  
  try {
    // First, check if vendor_id column exists
    console.log('1. Checking current products table structure...');
    const { data: testProduct, error: testError } = await supabase
      .from('products')
      .select('id, vendor_id, name')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('column "vendor_id" does not exist')) {
        console.log('   vendor_id column does not exist - needs to be added');
        
        console.log('\n2. MANUAL SQL REQUIRED:');
        console.log('   Please run these SQL commands in your Supabase SQL Editor:');
        console.log('\n   -- Add vendor_id column');
        console.log('   ALTER TABLE products ADD COLUMN vendor_id UUID;');
        console.log('\n   -- Add foreign key constraint');
        console.log('   ALTER TABLE products ADD CONSTRAINT fk_vendor');
        console.log('   FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;');
        
        console.log('\n3. After running the SQL, your products page fetch query is already updated!');
        console.log('   The query in src/app/products/page.tsx already includes vendor details:');
        console.log('   - Lines 81-83: vendor:vendor_id (store_name)');
        console.log('   - Lines 493-497: Display vendor name in product cards');
        
      } else {
        console.log('   Error checking products table:', testError.message);
      }
    } else {
      console.log('   vendor_id column already exists!');
      console.log('   Sample data:', testProduct);
      
      // Check if foreign key constraint exists
      console.log('\n2. Checking if foreign key constraint exists...');
      // This is harder to check with anon key, but we can try to insert invalid data
      console.log('   Foreign key constraint check requires admin access');
      console.log('   Your fetch query should work if vendor_id column exists');
    }
    
    console.log('\n=== PRODUCTS PAGE QUERY STATUS ===');
    console.log('The fetch query in src/app/products/page.tsx is already correctly configured:');
    console.log('   - Selects vendor_id column');
    console.log('   - Joins with vendors table to get store_name');
    console.log('   - Displays vendor name in product cards');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndFixVendorId().catch(console.error);
