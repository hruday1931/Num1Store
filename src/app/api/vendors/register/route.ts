import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      store_name,
      store_description,
      phone_number,
      plan_id,
      plan_price
    } = body;

    // Validate required fields
    if (!user_id || !store_name || !store_description || !phone_number || !plan_id || !plan_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Start a transaction by using RPC or multiple operations
    // First, create the vendor record
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id,
        store_name,
        store_description,
        phone_number,
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

    return NextResponse.json({
      success: true,
      vendor,
      subscription,
      message: 'Vendor account created successfully'
    });

  } catch (error) {
    console.error('Error in vendor registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
