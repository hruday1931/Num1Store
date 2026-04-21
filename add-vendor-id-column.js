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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('Please add it to your .env.local file to apply schema changes');
  console.log('You can get this from your Supabase project settings > API > service_role');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addVendorIdColumn() {
  console.log('Adding vendor_id column to products table...');
  
  try {
    // Step 1: Add vendor_id column
    console.log('Step 1: Adding vendor_id column...');
    const { error: addColumnError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE products ADD COLUMN vendor_id UUID;' 
      });
    
    if (addColumnError) {
      console.log('Error adding vendor_id column:', addColumnError);
      // Try alternative approach using raw SQL
      console.log('Trying alternative approach...');
    } else {
      console.log('vendor_id column added successfully');
    }
    
    // Step 2: Add foreign key constraint
    console.log('Step 2: Adding foreign key constraint...');
    const { error: addConstraintError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE products ADD CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;' 
      });
    
    if (addConstraintError) {
      console.log('Error adding foreign key constraint:', addConstraintError);
    } else {
      console.log('Foreign key constraint added successfully');
    }
    
    // Check if columns were added
    console.log('Verifying changes...');
    const { data: productsData, error: checkError } = await supabase
      .from('products')
      .select('id, vendor_id, name')
      .limit(1);
    
    if (checkError) {
      console.log('Error checking products table:', checkError);
    } else {
      console.log('Products table structure updated successfully');
      console.log('Sample data:', productsData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addVendorIdColumn().catch(console.error);
