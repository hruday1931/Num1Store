// Script to check and fix vendor status columns in database
// Run with: node check-and-fix-vendor-schema.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (add this to your .env.local)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixVendorSchema() {
  try {
    console.log('Checking database schema for vendor status columns...');
    
    // Check if columns exist
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .in('column_name', ['is_vendor', 'subscription_status']);
    
    if (columnError) {
      console.log('Could not check columns, trying to add them directly...');
    }
    
    // Try to add the columns (IF NOT EXISTS will prevent errors if they already exist)
    console.log('Adding vendor status columns...');
    
    const { error: alterError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' 
          CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));
        `
      });
    
    if (alterError) {
      console.error('Error adding columns:', alterError);
      console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
      console.log('See fix-vendor-status-columns.sql file');
    } else {
      console.log('Successfully added vendor status columns!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Alternative approach using direct SQL
async function fixWithDirectSQL() {
  try {
    console.log('Running direct SQL to fix schema...');
    
    const sql = `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' 
      CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));
    `;
    
    // This would require a service role key and proper permissions
    console.log('SQL to run manually in Supabase SQL Editor:');
    console.log(sql);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

if (require.main === module) {
  checkAndFixVendorSchema();
}

module.exports = { checkAndFixVendorSchema, fixWithDirectSQL };
