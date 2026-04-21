// Script to run the SQL migration
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('Running products table migration...');
    
    // Read the SQL file
    const sql = fs.readFileSync('./products-migration.sql', 'utf8');
    
    // Split into individual statements and run them
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        
        // Use the REST API to execute SQL (this might not work with anon key)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
          if (error) {
            console.log('RPC failed, this is expected with anon key');
          }
        } catch (e) {
          console.log('RPC not available, manual execution required');
        }
      }
    }
    
    console.log('\n=== MANUAL STEPS REQUIRED ===');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('1. Open Supabase Dashboard -> SQL Editor');
    console.log('2. Copy and paste the contents of products-migration.sql');
    console.log('3. Click "Run" to execute the migration');
    console.log('\nThis will:');
    console.log('- Add missing columns (is_active, is_featured, category, images, inventory_count)');
    console.log('- Insert 6 sample products for testing');
    console.log('- Update existing products with default values');
    
    // Test current state
    console.log('\nTesting current products table...');
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Current table error:', error);
    } else {
      console.log(`Current state: ${count} products in table`);
      if (count > 0) {
        console.log('Sample product:', data[0]);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();
