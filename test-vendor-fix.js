const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testVendorFix() {
  try {
    console.log('=== Testing Vendor Foreign Key Fix ===');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
      console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
      return;
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✓ Supabase client created');

    // Step 1: Check for orphaned products
    console.log('\n=== Checking for Orphaned Products ===');
    const { data: orphanedProducts, error: orphanError } = await supabase
      .from('products')
      .select('id, name, vendor_id')
      .filter('vendor_id', 'not.in', '(SELECT id FROM vendors)');

    if (orphanError) {
      console.log('Orphaned products check error:', orphanError.message);
    } else {
      console.log('Orphaned products found:', orphanedProducts?.length || 0);
      if (orphanedProducts && orphanedProducts.length > 0) {
        console.log('Sample orphaned products:', orphanedProducts.slice(0, 3));
      }
    }

    // Step 2: Check existing vendors
    console.log('\n=== Checking Existing Vendors ===');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, store_name, is_approved');

    if (vendorError) {
      console.error('Error fetching vendors:', vendorError);
    } else {
      console.log('Total vendors:', vendors?.length || 0);
      if (vendors && vendors.length > 0) {
        console.log('Sample vendors:', vendors.slice(0, 3));
      }
    }

    // Step 3: Check valid products
    console.log('\n=== Checking Valid Products ===');
    const { data: validProducts, error: validError } = await supabase
      .from('products')
      .select('id, name, vendor_id, store_name')
      .select('*, vendors!inner(store_name)')
      .limit(5);

    if (validError) {
      console.error('Error fetching valid products:', validError);
    } else {
      console.log('Valid products with vendor info:', validProducts?.length || 0);
      if (validProducts && validProducts.length > 0) {
        validProducts.forEach(product => {
          console.log(`- ${product.name} (Vendor: ${product.vendors?.store_name || 'Unknown'})`);
        });
      }
    }

    // Step 4: Test product creation with valid vendor
    if (vendors && vendors.length > 0) {
      console.log('\n=== Testing Product Creation ===');
      const testVendor = vendors[0];
      console.log('Using vendor:', testVendor.store_name, 'ID:', testVendor.id);

      const testProduct = {
        name: 'Test Product ' + Date.now(),
        description: 'This is a test product to verify the fix',
        price: 99.99,
        category: 'electronics',
        inventory_count: 10,
        vendor_id: testVendor.id,
        images: [],
        is_active: true
      };

      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Product creation failed:', insertError.message);
        console.error('Details:', insertError);
      } else {
        console.log('✅ Product created successfully:', insertedProduct.name);
        
        // Clean up test product
        await supabase
          .from('products')
          .delete()
          .eq('id', insertedProduct.id);
        console.log('✅ Test product cleaned up');
      }
    }

    console.log('\n=== Test Complete ===');
    console.log('Key findings:');
    console.log('1. Orphaned products should be 0 after running the SQL fix');
    console.log('2. At least one vendor should exist');
    console.log('3. Product creation should work with valid vendor_id');
    console.log('\nNext steps:');
    console.log('1. Run fix-vendor-foreign-key.sql in Supabase SQL Editor');
    console.log('2. Run fix-product-creation.sql for additional improvements');
    console.log('3. Test the frontend product creation form');

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testVendorFix();
