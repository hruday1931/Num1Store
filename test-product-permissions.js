// Test script to check product permissions
// Run this in browser console on the product edit page

async function testProductPermissions() {
  console.log('Testing product permissions...');
  
  // Get current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  console.log('Current user:', user);
  
  if (userError || !user) {
    console.error('No authenticated user found');
    return;
  }
  
  // Get vendor for current user
  const { data: vendorData, error: vendorError } = await supabaseClient()
    .from('vendors')
    .select('id, user_id, is_approved')
    .eq('user_id', user.id)
    .single();
    
  console.log('Vendor data:', { vendorData, vendorError });
  
  if (vendorError || !vendorData) {
    console.error('No vendor found for user');
    return;
  }
  
  // Test reading a product
  const productId = window.location.pathname.split('/').pop();
  console.log('Testing with product ID:', productId);
  
  const { data: product, error: productError } = await supabaseClient()
    .from('products')
    .select('id, name, vendor_id')
    .eq('id', productId)
    .eq('vendor_id', vendorData.id)
    .single();
    
  console.log('Product read test:', { product, productError });
  
  // Test updating the product (minimal change)
  if (product) {
    const { error: updateError } = await supabaseClient()
      .from('products')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('vendor_id', vendorData.id);
      
    console.log('Product update test:', { updateError });
  }
}

// Run the test
testProductPermissions();
