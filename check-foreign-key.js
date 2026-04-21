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

async function checkForeignKey() {
  console.log('=== CHECKING FOREIGN KEY CONSTRAINT ===\n');
  
  try {
    // Check if we have any products with vendor data
    console.log('1. Testing vendor relationship...');
    const { data: productsWithVendors, error: vendorError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        vendor_id,
        vendor:vendor_id (
          id,
          store_name
        )
      `)
      .limit(3);
    
    if (vendorError) {
      console.log('   Error testing vendor relationship:', vendorError.message);
      console.log('   This might indicate missing foreign key constraint');
      
      console.log('\n2. To add the foreign key constraint, run this SQL in Supabase:');
      console.log('   ALTER TABLE products ADD CONSTRAINT fk_vendor');
      console.log('   FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;');
      
    } else {
      console.log('   Vendor relationship working!');
      console.log('   Sample products with vendors:');
      productsWithVendors.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - Vendor: ${product.vendor?.store_name || 'None'} (vendor_id: ${product.vendor_id || 'NULL'})`);
      });
      
      if (productsWithVendors.length === 0) {
        console.log('   No products found in database');
      }
    }
    
    // Check vendors table
    console.log('\n3. Checking vendors table...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, store_name')
      .limit(5);
    
    if (vendorsError) {
      console.log('   Error accessing vendors table:', vendorsError.message);
    } else {
      console.log('   Found vendors:');
      vendors.forEach((vendor, index) => {
        console.log(`   ${index + 1}. ${vendor.store_name} (ID: ${vendor.id})`);
      });
      
      if (vendors.length === 0) {
        console.log('   No vendors found - you may need to create vendor records first');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkForeignKey().catch(console.error);
