import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Define vendor type
interface Vendor {
  pickup_location_id: string | null;
  store_name: string | null;
  phone_number: string | null;
}

// Shiprocket API endpoints
const SHIPROCKET_PICKUP_LOCATIONS_URL = 'https://apiv2.shiprocket.in/v1/external/settings/company/pickuplocations';

// Helper function to get Shiprocket token
async function getShiprocketToken(): Promise<string> {
  const authResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shiprocket/auth`, {
    method: 'POST',
  });
  
  if (!authResponse.ok) {
    throw new Error('Failed to authenticate with Shiprocket');
  }
  
  const authData = await authResponse.json();
  if (!authData.success || !authData.token) {
    throw new Error('Invalid Shiprocket authentication response');
  }
  
  return authData.token;
}

// Helper function to get existing pickup locations
async function getExistingPickupLocations(token: string): Promise<any[]> {
  const response = await fetch(SHIPROCKET_PICKUP_LOCATIONS_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch existing pickup locations');
  }

  const data = await response.json();
  return data.data || [];
}

// Helper function to add pickup location
async function addPickupLocation(token: string, locationData: any): Promise<any> {
  const response = await fetch(SHIPROCKET_PICKUP_LOCATIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to add pickup location: ${response.statusText} - ${errorData}`);
  }

  return response.json();
}

// Helper function to update pickup location
async function updatePickupLocation(token: string, locationId: number, locationData: any): Promise<any> {
  const response = await fetch(`${SHIPROCKET_PICKUP_LOCATIONS_URL}/${locationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update pickup location: ${response.statusText} - ${errorData}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, storeName, address, isUpdate = false } = body;

    // Validate required fields
    if (!vendorId || !storeName || !address) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID, store name, and address are required' },
        { status: 400 }
      );
    }

    // Validate address fields
    const requiredAddressFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'pin_code'];
    const missingFields = requiredAddressFields.filter(field => !address[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required address fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('pickup_location_id, store_name, phone_number')
      .eq('user_id', vendorId)
      .single() as { data: Vendor | null, error: any };

    if (vendorError || !vendor) {
      console.error('Vendor fetch error:', vendorError);
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Prepare pickup location data for Shiprocket
    const pickupLocationData = {
      pickup_location: storeName,
      name: address.name,
      email: address.email,
      phone: address.phone,
      address: address.address,
      address_2: address.address_2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      pin_code: address.pin_code,
    };

    let result;
    let pickupLocationId: string;

    if (isUpdate && vendor.pickup_location_id) {
      // Update existing pickup location
      try {
        const locationId = parseInt(vendor.pickup_location_id);
        result = await updatePickupLocation(token, locationId, pickupLocationData);
        pickupLocationId = vendor.pickup_location_id;
        console.log('Pickup location updated successfully:', result);
      } catch (error) {
        console.error('Error updating pickup location:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update pickup location in Shiprocket' },
          { status: 500 }
        );
      }
    } else {
      // Add new pickup location
      try {
        // First check if pickup location with same name already exists
        const existingLocations = await getExistingPickupLocations(token);
        const existingLocation = existingLocations.find(loc => 
          loc.pickup_location === storeName || 
          (loc.address === address.address && loc.pin_code === address.pin_code)
        );

        if (existingLocation) {
          // Use existing location
          pickupLocationId = existingLocation.id.toString();
          result = { ...existingLocation, message: 'Using existing pickup location' };
          console.log('Using existing pickup location:', existingLocation);
        } else {
          // Create new pickup location
          result = await addPickupLocation(token, pickupLocationData);
          
          if (!result.data || !result.data.id) {
            throw new Error('Invalid response from Shiprocket: missing pickup location ID');
          }
          
          pickupLocationId = result.data.id.toString();
          console.log('New pickup location created successfully:', result);
        }
      } catch (error) {
        console.error('Error adding pickup location:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to add pickup location in Shiprocket' },
          { status: 500 }
        );
      }
    }

    // Update vendor record with pickup location ID
    const { error: updateError } = await (supabase as unknown as {
      from: (table: string) => any;
      update: (data: any) => any;
      eq: (column: string, value: string) => any;
    })
      .from('vendors')
      .update({
        pickup_location_id: pickupLocationId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', vendorId);

    if (updateError) {
      console.error('Error updating vendor with pickup location ID:', updateError);
      // Don't fail the response, but log the error
    }

    return NextResponse.json({
      success: true,
      pickupLocationId,
      pickupLocationName: storeName,
      message: isUpdate ? 'Pickup location updated successfully' : 'Pickup location registered successfully',
      shiprocketData: result
    });

  } catch (error) {
    console.error('Pickup location registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register pickup location',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve vendor's pickup location info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('pickup_location_id, store_name, phone_number')
      .eq('user_id', vendorId)
      .single() as { data: Vendor | null, error: any };

    if (vendorError || !vendor) {
      console.error('Vendor fetch error:', vendorError);
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    let pickupLocationDetails = null;

    if (vendor.pickup_location_id) {
      try {
        // Get Shiprocket token
        const token = await getShiprocketToken();
        
        // Get pickup location details from Shiprocket
        const response = await fetch(`${SHIPROCKET_PICKUP_LOCATIONS_URL}/${vendor.pickup_location_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          pickupLocationDetails = data.data;
        }
      } catch (error) {
        console.error('Error fetching pickup location details:', error);
        // Don't fail the response, just continue without pickup details
      }
    }

    return NextResponse.json({
      success: true,
      hasPickupLocation: !!vendor.pickup_location_id,
      pickupLocationId: vendor.pickup_location_id,
      storeName: vendor.store_name,
      pickupLocationDetails
    });

  } catch (error) {
    console.error('Get pickup location error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get pickup location',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
