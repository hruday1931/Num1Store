const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCart() {
  console.log('=== CART DEBUG CHECK ===');
  
  try {
    // Check if we can connect to Supabase
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('cart').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Total cart items:', data);
    
    // Get all cart items to see what's there
    const { data: allCartItems, error: allCartError } = await supabase
      .from('cart')
      .select('*');
    
    if (allCartError) {
      console.error('Error fetching all cart items:', allCartError);
      return;
    }
    
    console.log('\n=== ALL CART ITEMS ===');
    console.log('Found', allCartItems.length, 'cart items:');
    allCartItems.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log('  ID:', item.id);
      console.log('  User ID:', item.user_id);
      console.log('  Product ID:', item.product_id);
      console.log('  Quantity:', item.quantity);
      console.log('  Created At:', item.created_at);
    });
    
    // Get user info to compare
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('\nError getting current user:', userError);
      console.log('Note: This might be expected if no user is logged in');
    } else if (user) {
      console.log('\n=== CURRENT USER ===');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      
      // Get cart items for this specific user
      const { data: userCartItems, error: userCartError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id);
      
      if (userCartError) {
        console.error('Error fetching user cart items:', userCartError);
      } else {
        console.log('\n=== CART ITEMS FOR CURRENT USER ===');
        console.log('Found', userCartItems.length, 'cart items for user', user.id);
        userCartItems.forEach((item, index) => {
          console.log(`\nUser Item ${index + 1}:`);
          console.log('  ID:', item.id);
          console.log('  Product ID:', item.product_id);
          console.log('  Quantity:', item.quantity);
        });
      }
    } else {
      console.log('\n=== NO USER LOGGED IN ===');
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugCart();
