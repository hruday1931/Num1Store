import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { registerVendorPickupLocation } from '@/lib/vendor-utils';

// Create Supabase client only at runtime, not build time
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate environment variables only at runtime, not build time
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for vendor register:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
  }

  return createClient(
    supabaseUrl || '',
    supabaseServiceKey || ''
  );
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      store_name,
      store_description,
      phone_number,
      plan_id,
      plan_price,
      pickup_address,
      register_pickup_location
    } = body;

    // Validate required fields
    if (!user_id || !store_name || !store_description || !phone_number || !plan_id || !plan_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client at runtime
    const supabase = createSupabaseClient();

    // Start a transaction by using RPC or multiple operations
    // First, create the vendor record
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id,
        store_name,
        store_description,
        phone_number,
        pickup_address: pickup_address || null,
        is_approved: true, // Auto-approve for now
        is_subscribed: true
      })
      .select()
      .single();

    if (vendorError) {
      console.error('Error creating vendor:', vendorError);
      return NextResponse.json(
        { error: 'Failed to create vendor account' },
        { status: 500 }
      );
    }

    // Create the subscription record
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const { data: subscription, error: subscriptionError } = await supabase
      .from('vendor_subscriptions')
      .insert({
        user_id,
        vendor_id: vendor.id,
        plan_type: plan_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        price_paid: plan_price
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      // Rollback vendor creation if subscription fails
      await supabase.from('vendors').delete().eq('id', vendor.id);
      
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Update user's role in profiles table if it exists
    await supabase
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', user_id);

    // Register pickup location in Shiprocket if requested and pickup_address is provided
    let shiprocketResult = null;
    if (register_pickup_location && pickup_address && vendor) {
      shiprocketResult = await registerVendorPickupLocation({
        vendor_id: vendor.id,
        store_name: vendor.store_name,
        phone_number: vendor.phone_number,
        pickup_address: pickup_address,
        user_id: user_id
      });
    }

    return NextResponse.json({
      success: true,
      vendor,
      subscription,
      shiprocket_result: shiprocketResult,
      message: shiprocketResult?.success 
        ? 'Vendor account created and pickup location registered successfully'
        : 'Vendor account created successfully'
    });

  } catch (error) {
    console.error('Error in vendor registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
