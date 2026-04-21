/**
 * Fix schema cache issue for customer_id column in orders table
 * This script applies the necessary SQL fixes to refresh PostgREST schema cache
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Read the SQL file
const fs = require('fs');
const path = require('path');

async function fixSchemaCache() {
  try {
    console.log('=== Fixing Schema Cache Issue ===');
    
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('1. Reading SQL fix file...');
    const sqlFilePath = path.join(__dirname, 'fix-checkout-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('2. Executing schema fixes...');
    
    // Split the SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // If exec_sql doesn't exist, try direct SQL execution
            console.warn('   exec_sql RPC not available, trying direct execution...');
            
            // For schema changes, we need to use the SQL editor directly
            console.log(`   SQL Statement: ${statement.substring(0, 100)}...`);
            console.log('   NOTE: This statement needs to be run manually in Supabase SQL Editor');
          } else {
            console.log('   Success!');
          }
        } catch (stmtError) {
          console.warn(`   Statement failed (may need manual execution): ${stmtError.message}`);
        }
      }
    }
    
    console.log('\n3. Manual Instructions:');
    console.log('   If the automated execution failed, please run these steps manually:');
    console.log('   a) Open Supabase Dashboard > SQL Editor');
    console.log('   b) Copy and paste the contents of fix-checkout-schema.sql');
    console.log('   c) Click "Run" to execute all the fixes');
    console.log('   d) Wait for the schema cache to refresh (usually takes 30-60 seconds)');
    
    console.log('\n4. Testing the fix...');
    
    // Test if we can now access the orders table with customer_id
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id, customer_id, total_amount, status')
      .limit(1);
    
    if (testError) {
      console.error('   Test failed - schema cache may need more time to refresh:', testError.message);
      console.log('   Please wait 1-2 minutes and try the checkout again');
    } else {
      console.log('   Test passed! Schema cache is updated');
    }
    
    console.log('\n=== Schema Cache Fix Complete ===');
    
  } catch (error) {
    console.error('Schema cache fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixSchemaCache();
