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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductsAccess() {
  console.log('Testing products access with current schema...');
  
  try {
    // Try to fetch products without category first
    const { data: basicProducts, error: basicError } = await supabase
      .from('products')
      .select('id, name, description, price, is_active')
      .eq('is_active', true)
      .limit(5);
    
    if (basicError) {
      console.error('Basic products query failed:', basicError);
      return false;
    }
    
    console.log('✓ Basic products access works');
    console.log(`Found ${basicProducts?.length || 0} products`);
    
    // Now try with category column
    const { data: fullProducts, error: fullError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    if (fullError) {
      console.error('❌ Full products query failed (missing category column):');
      console.error('Error:', fullError.message);
      console.error('Code:', fullError.code);
      
      console.log('\n🔧 TO FIX THIS:');
      console.log('1. Open your Supabase project');
      console.log('2. Go to SQL Editor');
      console.log('3. Run the SQL in fix-category-column.sql');
      console.log('4. Refresh your products page');
      
      return false;
    }
    
    console.log('✓ Full products access works');
    console.log(`Found ${fullProducts?.length || 0} products with all columns`);
    
    // Display sample products
    if (fullProducts && fullProducts.length > 0) {
      console.log('\nSample products:');
      fullProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price} (${product.category || 'No category'})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return false;
  }
}

testProductsAccess().then(success => {
  if (success) {
    console.log('\n✅ Products table is working correctly!');
  } else {
    console.log('\n❌ Products table needs fixing - see instructions above');
  }
}).catch(console.error);
