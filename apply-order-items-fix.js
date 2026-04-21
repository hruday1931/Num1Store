const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFile = path.join(__dirname, 'fix-order-items-rls.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Create Supabase client - we need to use the service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nPlease set these in your environment and run again.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  try {
    console.log('Applying order items RLS fix...');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // If exec_sql doesn't exist, try direct SQL via .from
          console.log('exec_sql not available, trying alternative method...');
          
          // For DDL statements, we need to use the SQL editor directly
          console.log('Please manually run this SQL in Supabase SQL Editor:');
          console.log('---');
          console.log(statement);
          console.log('---');
        } else {
          console.log('Statement executed successfully');
        }
      } catch (err) {
        console.error('Error executing statement:', err.message);
        console.log('Statement:', statement);
      }
    }
    
    console.log('\nFix application completed!');
    console.log('If some statements failed, please run the remaining SQL manually in the Supabase SQL Editor.');
    console.log('The SQL file is located at: fix-order-items-rls.sql');
    
  } catch (error) {
    console.error('Error applying fix:', error);
  }
}

applyFix();
