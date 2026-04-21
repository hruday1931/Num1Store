const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixSchema() {
  try {
    console.log('🔍 Checking current orders table schema...');
    
    // First, let's check if the columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public')
      .in('column_name', ['payment_method', 'payment_status']);

    if (columnsError) {
      console.log('⚠️  Cannot check schema directly, attempting to add columns anyway...');
    } else {
      console.log('Current columns found:', columns?.map(c => c.column_name) || []);
    }

    console.log('\n📝 To fix the COD order error, please run this SQL in your Supabase SQL Editor:');
    console.log('='.repeat(60));
    
    const fs = require('fs');
    const sqlScript = fs.readFileSync('./add-payment-method-column.sql', 'utf8');
    console.log(sqlScript);
    
    console.log('='.repeat(60));
    console.log('\n🔗 How to run this fix:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Click on "SQL Editor" in the sidebar');
    console.log('3. Copy and paste the SQL script above');
    console.log('4. Click "Run" to execute');
    console.log('\n✅ After running the SQL, the COD order functionality should work correctly!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAndFixSchema();
