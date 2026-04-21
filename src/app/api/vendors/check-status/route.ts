import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists and has a vendor record with active subscription
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_subscriptions (
          id,
          plan_type,
          is_active,
          end_date
        )
      `)
      .eq('user_id', user_id)
      .single();

    if (vendorError && vendorError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Error checking vendor status:', vendorError);
      return NextResponse.json(
        { error: 'Failed to check vendor status' },
        { status: 500 }
      );
    }

    // Check if vendor exists and has active subscription
    const isVendor = !!vendor;
    const isSubscribed = isVendor && vendor.is_approved && 
      vendor.vendor_subscriptions?.some((sub: any) => 
        sub.is_active && new Date(sub.end_date) > new Date()
      );

    return NextResponse.json({
      isVendor,
      isSubscribed,
      vendor: isVendor ? {
        id: vendor.id,
        store_name: vendor.store_name,
        is_approved: vendor.is_approved,
        is_subscribed: vendor.is_subscribed
      } : null
    });

  } catch (error) {
    console.error('Error in vendor status check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
