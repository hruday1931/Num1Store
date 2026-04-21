import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Shiprocket API endpoints
const SHIPROCKET_PICKUP_URL = 'https://apiv2.shiprocket.in/v1/external/orders/create/pickup';

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

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get order details to check if it has a Shiprocket order ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('shiprocket_order_id, pickup_status')
      .eq('id', orderId)
      .single() as { data: any, error: any };

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.shiprocket_order_id) {
      return NextResponse.json(
        { success: false, error: 'Order must be created in Shiprocket first' },
        { status: 400 }
      );
    }

    if (order.pickup_status === 'scheduled' || order.pickup_status === 'picked') {
      return NextResponse.json(
        { success: false, error: 'Pickup already requested or completed' },
        { status: 400 }
      );
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Create pickup request
    const pickupResponse = await fetch(SHIPROCKET_PICKUP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: order.shiprocket_order_id
      })
    });

    if (!pickupResponse.ok) {
      const errorData = await pickupResponse.text();
      console.error('Shiprocket pickup request failed:', {
        status: pickupResponse.status,
        statusText: pickupResponse.statusText,
        response: errorData
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create pickup request in Shiprocket',
          details: `HTTP ${pickupResponse.status}: ${pickupResponse.statusText}`
        },
        { status: pickupResponse.status }
      );
    }

    const pickupResult = await pickupResponse.json();

    // Update order with pickup details
    const { error: updateError } = await (supabase as unknown as {
      from: (table: string) => any;
      update: (data: any) => any;
      eq: (column: string, value: string) => any;
    })
      .from('orders')
      .update({
        pickup_status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with pickup details:', updateError);
      // Don't fail the response, but log the error
    }

    console.log('Shiprocket pickup request created successfully:', pickupResult);

    return NextResponse.json({
      success: true,
      pickupId: pickupResult.pickup_id,
      pickupDate: pickupResult.pickup_date,
      pickupTime: pickupResult.pickup_time,
      status: pickupResult.status,
      message: 'Pickup request successfully created in Shiprocket'
    });

  } catch (error) {
    console.error('Shiprocket pickup request error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create pickup request in Shiprocket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
