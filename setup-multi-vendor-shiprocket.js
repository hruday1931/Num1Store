/**
 * Setup script for multi-vendor Shiprocket integration
 * This script will:
 * 1. Run the database migration to add location_tag field
 * 2. Verify the setup
 * 3. Update existing vendors with location tags
 * 
 * Run with: node setup-multi-vendor-shiprocket.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runDatabaseMigration() {
  console.log('🔧 Running database migration...');
  
  try {
    // Read the SQL migration file
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add-location-tag-field.sql'), 
      'utf8'
    );

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }

    console.log('✅ Database migration completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if vendors table has location_tag column
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'vendors' });

    if (columnError) {
      console.log('⚠️  Could not verify columns (this is normal if RPC function doesn\'t exist)');
    } else {
      const hasLocationTag = columns?.some(col => col.column_name === 'location_tag');
      console.log(`   location_tag column: ${hasLocationTag ? '✅' : '❌'}`);
    }

    // Check existing vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, store_name, location_tag, pickup_location_registered, shiprocket_pickup_location_id')
      .limit(5);

    if (vendorError) {
      console.error('❌ Error checking vendors:', vendorError);
      return false;
    }

    console.log(`   Found ${vendors.length} vendors in database`);
    
    if (vendors.length > 0) {
      console.log('   Sample vendors:');
      vendors.forEach(vendor => {
        console.log(`     - ${vendor.store_name}: pickup_registered=${vendor.pickup_location_registered}, location_tag=${vendor.location_tag || 'null'}`);
      });
    }

    // Check environment variables
    const requiredEnvVars = [
      'SHIPROCKET_EMAIL',
      'SHIPROCKET_PASSWORD',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    console.log('\n📋 Environment variables:');
    requiredEnvVars.forEach(envVar => {
      const isSet = !!process.env[envVar];
      console.log(`   ${envVar}: ${isSet ? '✅' : '❌'}`);
    });

    return true;
    
  } catch (error) {
    console.error('❌ Setup verification error:', error.message);
    return false;
  }
}

async function updateExistingVendors() {
  console.log('\n🔄 Updating existing vendors with location tags...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get vendors that have shiprocket_pickup_location_id but no location_tag
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id, store_name, shiprocket_pickup_location_id, location_tag')
      .eq('pickup_location_registered', true)
      .is('location_tag', null);

    if (fetchError) {
      console.error('❌ Error fetching vendors:', fetchError);
      return false;
    }

    if (vendors.length === 0) {
      console.log('✅ No vendors need location tag updates');
      return true;
    }

    console.log(`   Found ${vendors.length} vendors to update`);

    // Update each vendor with a location tag
    for (const vendor of vendors) {
      const locationTag = `${vendor.store_name.replace(/\s+/g, '_')}_${vendor.id}`;
      
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ location_tag })
        .eq('id', vendor.id);

      if (updateError) {
        console.error(`❌ Failed to update vendor ${vendor.store_name}:`, updateError);
      } else {
        console.log(`   ✅ Updated ${vendor.store_name} with location_tag: ${locationTag}`);
      }
    }

    return true;
    
  } catch (error) {
    console.error('❌ Error updating existing vendors:', error.message);
    return false;
  }
}

async function createTestVendors() {
  console.log('\n🧪 Creating test vendors (optional)...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const testVendors = [
      {
        id: 'test-electronics-vendor',
        user_id: 'test-user-1',
        store_name: 'Test Electronics Store',
        phone_number: '+919876543210',
        pickup_address: {
          address: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pin_code: '400001'
        },
        pickup_location_registered: false,
        status: 'active'
      },
      {
        id: 'test-fashion-vendor',
        user_id: 'test-user-2',
        store_name: 'Test Fashion Store',
        phone_number: '+919876543211',
        pickup_address: {
          address: '456 Fashion Avenue',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          pin_code: '110001'
        },
        pickup_location_registered: false,
        status: 'active'
      }
    ];

    for (const vendor of testVendors) {
      // Check if vendor already exists
      const { data: existing } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', vendor.id)
        .single();

      if (existing) {
        console.log(`   ⏭️  Vendor ${vendor.store_name} already exists, skipping...`);
        continue;
      }

      const { error: insertError } = await supabase
        .from('vendors')
        .insert(vendor);

      if (insertError) {
        console.error(`❌ Failed to create test vendor ${vendor.store_name}:`, insertError);
      } else {
        console.log(`   ✅ Created test vendor: ${vendor.store_name}`);
      }
    }

    return true;
    
  } catch (error) {
    console.error('❌ Error creating test vendors:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Multi-Vendor Shiprocket Integration Setup');
  console.log('=' .repeat(50));

  // Check environment first
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(env => console.log(`   - ${env}`));
    console.log('\nPlease set these environment variables and try again.');
    process.exit(1);
  }

  // Run setup steps
  const migrationSuccess = await runDatabaseMigration();
  if (!migrationSuccess) {
    console.error('❌ Setup failed at migration step');
    process.exit(1);
  }

  await verifySetup();
  await updateExistingVendors();
  
  // Ask user if they want to create test vendors
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n❓ Do you want to create test vendors? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await createTestVendors();
    }
    
    rl.close();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the test script: node test-multi-vendor-shiprocket-integration.js');
    console.log('2. Update vendor profiles with pickup addresses');
    console.log('3. Test order creation with multiple vendors');
    console.log('4. Verify Shiprocket dashboard for pickup locations and shipments');
    console.log('\n✨ Your multi-vendor Shiprocket integration is ready!');
  });
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runDatabaseMigration,
  verifySetup,
  updateExistingVendors,
  createTestVendors
};
