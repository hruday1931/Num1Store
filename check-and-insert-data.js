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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndInsertData() {
  console.log('Checking database tables...');
  
  // Check if products table exists and has data
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
    
  if (productError) {
    console.log('Products table error:', productError);
    return;
  }
  
  console.log('Products count:', products);
  
  // Check if vendors table exists
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .limit(1);
    
  if (vendorError) {
    console.log('Vendors table error:', vendorError);
    return;
  }
  
  console.log('Vendors count:', vendors);
  
  // If no vendors, create a sample vendor first
  if (!vendors || vendors.length === 0) {
    console.log('Creating sample vendor...');
    
    // First, we need to create a vendor without requiring a real user
    // For testing, let's try to insert with a dummy UUID
    const dummyUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data: newVendor, error: vendorInsertError } = await supabase
      .from('vendors')
      .insert({
        user_id: dummyUserId,
        store_name: 'Sample Store',
        store_description: 'A sample store for testing',
        is_approved: true
      })
      .select();
      
    if (vendorInsertError) {
      console.log('Vendor insert error:', vendorInsertError);
      
      // Try a different approach - let's insert products without vendor_id first
      console.log('Trying to insert products without vendor requirement...');
    } else {
      console.log('Sample vendor created:', newVendor);
    }
  }
  
  // Insert sample products
  console.log('Inserting sample products...');
  
  const sampleProducts = [
    {
      vendor_id: '00000000-0000-0000-0000-000000000000', // Dummy vendor ID
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
      price: 299.99,
      category: 'Electronics',
      images: ['/images/headphones1.jpg', '/images/headphones2.jpg'],
      inventory_count: 50,
      is_active: true
    },
    {
      vendor_id: '00000000-0000-0000-0000-000000000000',
      name: 'Organic Coffee Beans',
      description: 'Premium arabica coffee beans from Colombia, medium roast',
      price: 24.99,
      category: 'Food',
      images: ['/images/coffee1.jpg'],
      inventory_count: 100,
      is_active: true
    },
    {
      vendor_id: '00000000-0000-0000-0000-000000000000',
      name: 'Yoga Mat',
      description: 'Eco-friendly non-slip yoga mat with carrying strap',
      price: 39.99,
      category: 'Sports',
      images: ['/images/yogamat1.jpg', '/images/yogamat2.jpg'],
      inventory_count: 75,
      is_active: true
    },
    {
      vendor_id: '00000000-0000-0000-0000-000000000000',
      name: 'Smart Watch',
      description: 'Fitness tracker with heart rate monitor and GPS',
      price: 199.99,
      category: 'Electronics',
      images: ['/images/watch1.jpg', '/images/watch2.jpg'],
      inventory_count: 30,
      is_active: true
    },
    {
      vendor_id: '00000000-0000-0000-0000-000000000000',
      name: 'Running Shoes',
      description: 'Lightweight breathable running shoes with cushioned sole',
      price: 89.99,
      category: 'Sports',
      images: ['/images/shoes1.jpg', '/images/shoes2.jpg'],
      inventory_count: 60,
      is_active: true
    }
  ];
  
  const { data: insertedProducts, error: insertError } = await supabase
    .from('products')
    .insert(sampleProducts)
    .select();
    
  if (insertError) {
    console.log('Product insert error:', insertError);
    console.log('Error details:', {
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code
    });
  } else {
    console.log('Successfully inserted', insertedProducts?.length || 0, 'products');
    console.log('Sample products:', insertedProducts);
  }
  
  // Final check
  const { data: finalProducts } = await supabase
    .from('products')
    .select('*')
    .limit(5);
    
  console.log('\nFinal products count:', finalProducts?.length || 0);
  if (finalProducts && finalProducts.length > 0) {
    console.log('Sample product:', finalProducts[0]);
  }
}

checkAndInsertData().catch(console.error);
