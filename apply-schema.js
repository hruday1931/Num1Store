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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY; // We need service key for schema changes

if (!supabaseServiceKey) {
  console.log('SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('Please add it to your .env.local file to apply schema changes');
  console.log('You can get this from your Supabase project settings > API > service_role');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking current database schema...');
  
  // Check products table structure
  try {
    const { data: productsColumns, error: productsError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' });
      
    if (productsError) {
      console.log('Could not check products table columns:', productsError);
    } else {
      console.log('Products table columns:', productsColumns);
    }
  } catch (error) {
    console.log('Error checking products table:', error.message);
  }
  
  // Check vendors table structure
  try {
    const { data: vendorsColumns, error: vendorsError } = await supabase
      .rpc('get_table_columns', { table_name: 'vendors' });
      
    if (vendorsError) {
      console.log('Could not check vendors table columns:', vendorsError);
    } else {
      console.log('Vendors table columns:', vendorsColumns);
    }
  } catch (error) {
    console.log('Error checking vendors table:', error.message);
  }
  
  // Try a simple approach - just check what tables exist
  try {
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.log('Could not check tables:', tablesError);
    } else {
      console.log('Available tables:', tables);
    }
  } catch (error) {
    console.log('Error checking tables:', error.message);
  }
}

checkSchema().catch(console.error);
