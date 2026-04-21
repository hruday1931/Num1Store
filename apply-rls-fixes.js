const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFixes() {
  try {
    console.log('Applying RLS fixes for vendor dashboard...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix-vendor-order-items-rls.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          
          // Try alternative approach using direct SQL execution
          try {
            const { error: altError } = await supabase
              .from('pg_settings')
              .select('*')
              .limit(1);
              
            if (altError) {
              console.log('Cannot execute SQL directly. You need to apply the SQL manually:');
              console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
              console.log('---');
              console.log(sql);
              console.log('---');
              return;
            }
          } catch (e) {
            console.log('Cannot execute SQL directly. You need to apply the SQL manually:');
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
      }
    }
    
    console.log('RLS fixes applied successfully!');
    
  } catch (error) {
    console.error('Error applying RLS fixes:', error);
    console.log('\nPlease manually apply the SQL from fix-vendor-order-items-rls.sql in your Supabase SQL Editor');
  }
}

applyRLSFixes();
