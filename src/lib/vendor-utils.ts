import { createClient } from '@supabase/supabase-js';
import { shiprocketService } from './shiprocket';

interface VendorProfileData {
  vendor_id: string;
  store_name: string;
  phone_number: string;
  pickup_address?: {
    address: string;
    address_2?: string;
    city: string;
    state: string;
    country?: string;
    pin_code: string;
  };
  user_id: string;
}

/**
 * Automatically registers a pickup location in Shiprocket when a vendor profile is updated
 * This function can be called from any vendor update endpoint or trigger
 */
export async function registerVendorPickupLocation(vendorData: VendorProfileData): Promise<{
  success: boolean;
  message: string;
  pickupLocationId?: string;
}> {
  try {
    // Validate that pickup address is provided
    if (!vendorData.pickup_address) {
      return {
        success: false,
        message: 'Pickup address is required for Shiprocket registration'
      };
    }

    // Create Supabase client to get user email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user email for pickup location registration
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', vendorData.user_id)
      .single();

    if (!profile?.email) {
      return {
        success: false,
        message: 'User email not found for pickup location registration'
      };
    }

    // Prepare pickup location data for Shiprocket
    const pickupLocationData = {
      vendorId: vendorData.vendor_id,
      storeName: vendorData.store_name,
      pickupAddress: {
        name: vendorData.store_name,
        email: profile.email,
        phone: vendorData.phone_number,
        address: vendorData.pickup_address.address,
        address_2: vendorData.pickup_address.address_2 || '',
        city: vendorData.pickup_address.city,
        state: vendorData.pickup_address.state,
        country: vendorData.pickup_address.country || 'India',
        pin_code: vendorData.pickup_address.pin_code
      }
    };

    // Register pickup location with Shiprocket
    const result = await shiprocketService.registerPickupLocation(pickupLocationData);

    if (result.success) {
      // Update vendor record with Shiprocket pickup location info
      await supabase
        .from('vendors')
        .update({
          shiprocket_pickup_location_id: result.pickupLocationId,
          location_tag: result.locationTag,
          pickup_location_registered: true,
          pickup_location_registered_at: new Date().toISOString()
        })
        .eq('id', vendorData.vendor_id);
    }

    return result;

  } catch (error) {
    console.error('Error in registerVendorPickupLocation:', error);
    return {
      success: false,
      message: `Failed to register pickup location: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates pickup address data before Shiprocket registration
 */
export function validatePickupAddress(pickupAddress: any): {
  isValid: boolean;
  missingFields: string[];
} {
  const requiredFields = ['address', 'city', 'state', 'pin_code'];
  const missingFields = requiredFields.filter(field => !pickupAddress[field]);
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Checks if a vendor has a registered pickup location in Shiprocket
 */
export async function hasVendorPickupLocation(vendorId: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from('vendors')
      .select('pickup_location_registered, shiprocket_pickup_location_id')
      .eq('id', vendorId)
      .single();

    return !!(data?.pickup_location_registered && data?.shiprocket_pickup_location_id);
  } catch (error) {
    console.error('Error checking vendor pickup location:', error);
    return false;
  }
}
