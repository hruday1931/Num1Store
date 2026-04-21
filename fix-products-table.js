// Fix products table schema and add sample data
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixProductsTable() {
  try {
    console.log('Fixing products table schema...');
    
    // Add missing columns if they don't exist
    const alterTableSQL = `
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
    `;
    
    console.log('Adding missing columns...');
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
    
    if (alterError) {
      console.log('Could not use RPC, trying direct approach...');
      // Try direct column additions
      try {
        await supabase.from('products').select('is_active').limit(1);
      } catch (e) {
        console.log('Column is_active does not exist, need manual migration');
      }
    }
    
    // Insert sample products
    console.log('Adding sample products...');
    
    const sampleProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.',
        price: 199.99,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        inventory_count: 50,
        is_active: true,
        is_featured: true
      },
      {
        name: 'Organic Coffee Beans',
        description: 'Premium arabica coffee beans from high-altitude farms, medium roast with chocolate notes.',
        price: 24.99,
        category: 'Food & Beverages',
        images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
        inventory_count: 100,
        is_active: true,
        is_featured: false
      },
      {
        name: 'Yoga Mat Premium',
        description: 'Extra thick eco-friendly yoga mat with alignment markers and carrying strap.',
        price: 45.99,
        category: 'Sports & Fitness',
        images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
        inventory_count: 30,
        is_active: true,
        is_featured: true
      },
      {
        name: 'Smart Watch Pro',
        description: 'Advanced fitness tracking, heart rate monitoring, and smartphone integration.',
        price: 299.99,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
        inventory_count: 25,
        is_active: true,
        is_featured: false
      },
      {
        name: 'Ceramic Plant Pot Set',
        description: 'Set of 3 handmade ceramic plant pots with drainage holes and saucers.',
        price: 34.99,
        category: 'Home & Garden',
        images: ['https://images.unsplash.com/photo-1485955900006-10f4d1d966be?w=400'],
        inventory_count: 40,
        is_active: true,
        is_featured: false
      },
      {
        name: 'Leather Wallet',
        description: 'Genuine leather bifold wallet with RFID blocking technology and multiple card slots.',
        price: 59.99,
        category: 'Accessories',
        images: ['https://images.unsplash.com/photo-1627123424554-39d2a1e78d4b?w=400'],
        inventory_count: 60,
        is_active: true,
        is_featured: true
      }
    ];

    // Insert products one by one to avoid vendor_id constraint issues
    for (const product of sampleProducts) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          vendor_id: null // Temporarily set to null
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Error inserting ${product.name}:`, error);
      } else {
        console.log(`Successfully added: ${product.name}`);
      }
    }
    
    // Test the final result
    console.log('\nTesting final products table...');
    const { data: finalProducts, error: finalError, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);
    
    if (finalError) {
      console.error('Final test error:', finalError);
    } else {
      console.log(`Success! Found ${count} active products`);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fixProductsTable();
