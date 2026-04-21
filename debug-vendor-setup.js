// Debug script to check vendor setup for product creation
// Run this with: node debug-vendor-setup.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugVendorSetup() {
  console.log('=== Debugging Vendor Setup for Product Creation ===\n');

  try {
    // 1. Check if user exists and get their ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    console.log('Current user ID:', user.id);
    console.log('User email:', user.email);

    // 2. Check if user has a vendor record
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Vendor fetch error:', vendorError);
      
      if (vendorError.code === 'PGRST116') {
        console.log('No vendor record found for this user');
        console.log('Creating vendor record...');
        
        // Create a vendor record for the user
        const { data: newVendor, error: createError } = await supabase
          .from('vendors')
          .insert({
            user_id: user.id,
            store_name: 'My Store',
            store_description: 'Store description',
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating vendor:', createError);
        } else {
          console.log('Vendor created successfully:', newVendor);
        }
      }
    } else {
      console.log('Vendor record found:', vendor);
    }

    // 3. Check RLS policies on products table
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'products');

    if (policyError) {
      console.error('Policy fetch error:', policyError);
    } else {
      console.log('\nCurrent RLS policies for products table:');
      policies.forEach(policy => {
        console.log(`- ${policy.policyname} (${policy.cmd})`);
        if (policy.qual) console.log(`  USING: ${policy.qual}`);
        if (policy.with_check) console.log(`  WITH CHECK: ${policy.with_check}`);
      });
    }

    // 4. Test product creation with minimal data
    console.log('\nTesting product creation...');
    
    // Get vendor ID
    const { data: testVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (testVendor) {
      const testProduct = {
        name: 'Test Product',
        description: 'Test description',
        price: 10.99,
        category: 'Other',
        inventory_count: 1,
        vendor_id: testVendor.id,
        is_active: true
      };

      const { data: testResult, error: testError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (testError) {
        console.error('Test product creation failed:', testError);
        
        if (testError.code === '42501') {
          console.log('RLS Policy violation detected!');
          console.log('This suggests the RLS policies are not correctly configured.');
        }
      } else {
        console.log('Test product created successfully:', testResult);
        
        // Clean up test product
        await supabase
          .from('products')
          .delete()
          .eq('id', testResult.id);
      }
    }

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugVendorSetup();
