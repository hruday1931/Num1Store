const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCurrentUserVendor() {
  try {
    console.log('Reading SQL fix file...');
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./fix-current-user-vendor.sql', 'utf8');
    
    console.log('Executing vendor fix...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('Error executing vendor fix:', error);
      return;
    }
    
    console.log('Vendor fix executed successfully!');
    console.log('Result:', data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Alternative approach using direct SQL execution
async function fixVendorDirectly() {
  try {
    console.log('Getting current user...');
    
    // First, we need to get the current user ID
    // This requires the user to be authenticated
    console.log('Note: This script needs to be run with proper user authentication.');
    console.log('Please run the SQL directly in Supabase SQL Editor while logged in as the user who needs vendor access.');
    
    console.log('\nSQL to run in Supabase SQL Editor:');
    console.log('----------------------------------------');
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./fix-current-user-vendor.sql', 'utf8');
    console.log(sqlContent);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixVendorDirectly();
