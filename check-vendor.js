const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkVendor() {
  try {
    console.log('Checking vendor ID: 266be90a-76e1-405d-ac63-0f592a43f866');
    
    // Check if vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', '266be90a-76e1-405d-ac63-0f592a43f866')
      .single();
    
    console.log('Vendor check result:', { vendor, vendorError });
    
    if (vendorError || !vendor) {
      console.log('Vendor not found, checking all vendors...');
      const { data: allVendors, error: allVendorsError } = await supabase
        .from('vendors')
        .select('id, name, email')
        .limit(5);
      
      console.log('Available vendors:', allVendors);
      console.log('All vendors error:', allVendorsError);
    } else {
      console.log('Vendor found:', vendor);
    }
    
    // Check products table structure
    console.log('\nChecking products table access...');
    const { data: productsStructure, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(0);
    
    console.log('Products table accessible:', !productsError);
    if (productsError) {
      console.log('Products error:', productsError);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkVendor();
