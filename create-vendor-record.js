// Script to create the vendor record with the specified ID
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVendorRecord() {
  try {
    const vendorId = '266be90a-76e1-405d-ac63-0f592a43f866';
    
    // First, let's check if this vendor already exists
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('Error checking vendor:', checkError);
      return;
    }
    
    if (existingVendor) {
      console.log('Vendor already exists:', existingVendor);
      return;
    }
    
    // Create the vendor record with the specific ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        id: vendorId,
        user_id: vendorId, // Using same ID for simplicity, you may want to change this
        store_name: 'Test Store',
        store_description: 'Test vendor store for product creation',
        is_approved: true
      })
      .select()
      .single();
    
    if (vendorError) {
      console.error('Error creating vendor:', vendorError);
      return;
    }
    
    console.log('Vendor created successfully:', vendor);
    
    // Also create a profile record if needed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: vendorId,
        full_name: 'Test Vendor',
        phone: '1234567890'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('Profile created/updated:', profile);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createVendorRecord();
