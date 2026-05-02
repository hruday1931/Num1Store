import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { shiprocketService } from '@/lib/shiprocket';

// Create Supabase client only at runtime, not build time
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate environment variables only at runtime, not build time
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for vendor update:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
  }

  return createClient(
    supabaseUrl || '',
    supabaseServiceKey || ''
  );
};

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendor_id,
      store_name,
      store_description,
      phone_number,
      pickup_address,
      register_pickup_location
    } = body;

    // Validate required fields
    if (!vendor_id) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client at runtime
    const supabase = createSupabaseClient();

    // First, get the current vendor data
    const { data: currentVendor, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendor_id)
      .single();

    if (fetchError || !currentVendor) {
      console.error('Error fetching vendor:', fetchError);
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (store_name !== undefined) updateData.store_name = store_name;
    if (store_description !== undefined) updateData.store_description = store_description;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (pickup_address !== undefined) updateData.pickup_address = pickup_address;

    // Update vendor profile
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendor_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vendor:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vendor profile' },
        { status: 500 }
      );
    }

    // Register pickup location in Shiprocket if requested and pickup_address is provided
    let shiprocketResult = null;
    if (register_pickup_location && pickup_address) {
      // Get user email for pickup location registration
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', currentVendor.user_id)
        .single();

      const pickupLocationData = {
        vendorId: vendor_id,
        storeName: updatedVendor.store_name,
        pickupAddress: {
          name: updatedVendor.store_name,
          email: profile?.email || 'vendor@example.com',
          phone: updatedVendor.phone_number,
          address: pickup_address.address || pickup_address.street || '',
          address_2: pickup_address.address_2 || '',
          city: pickup_address.city,
          state: pickup_address.state,
          country: pickup_address.country || 'India',
          pin_code: pickup_address.pin_code || pickup_address.postal_code
        }
      };

      shiprocketResult = await shiprocketService.registerPickupLocation(pickupLocationData);

      if (shiprocketResult.success) {
        // Update vendor with shiprocket pickup location info
        await supabase
          .from('vendors')
          .update({
            shiprocket_pickup_location_id: shiprocketResult.pickupLocationId,
            location_tag: shiprocketResult.locationTag,
            pickup_location_registered: true,
            pickup_location_registered_at: new Date().toISOString()
          })
          .eq('id', vendor_id);
      }
    }

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
      shiprocket_result: shiprocketResult,
      message: shiprocketResult?.success 
        ? 'Vendor profile updated and pickup location registered successfully'
        : 'Vendor profile updated successfully'
    });

  } catch (error) {
    console.error('Error in vendor profile update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
