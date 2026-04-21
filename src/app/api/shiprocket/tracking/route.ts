import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Shiprocket API endpoints
const SHIPROCKET_TRACKING_URL = 'https://apiv2.shiprocket.in/v1/external/courier/track/shipment';

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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('shiprocket_order_id, awb_code, status')
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

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Fetch tracking information
    const trackingResponse = await fetch(`${SHIPROCKET_TRACKING_URL}/${order.shiprocket_order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!trackingResponse.ok) {
      const errorData = await trackingResponse.text();
      console.error('Shiprocket tracking fetch failed:', {
        status: trackingResponse.status,
        statusText: trackingResponse.statusText,
        response: errorData
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tracking information from Shiprocket',
          details: `HTTP ${trackingResponse.status}: ${trackingResponse.statusText}`
        },
        { status: trackingResponse.status }
      );
    }

    const trackingData = await trackingResponse.json();

    // Extract AWB code and tracking information
    const awbCode = trackingData.awb_code || trackingData.tracking_data?.awb_code;
    const currentStatus = trackingData.tracking_data?.shipment_status;
    const estimatedDelivery = trackingData.tracking_data?.etd;

    // Update order with tracking information
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (awbCode && awbCode !== order.awb_code) {
      updateData.awb_code = awbCode;
    }

    if (estimatedDelivery) {
      updateData.estimated_delivery = estimatedDelivery;
    }

    // Map Shiprocket status to our status
    let newOrderStatus = order.status;
    if (currentStatus) {
      switch (currentStatus.toLowerCase()) {
        case 'delivered':
          newOrderStatus = 'delivered';
          updateData.delivered_at = new Date().toISOString();
          break;
        case 'in transit':
        case 'dispatched':
          if (order.status === 'processing') {
            newOrderStatus = 'shipped';
          }
          break;
        case 'out for delivery':
          newOrderStatus = 'shipped';
          break;
        default:
          // Keep existing status for other cases
          break;
      }
    }

    if (newOrderStatus !== order.status) {
      updateData.status = newOrderStatus;
    }

    // Update order in database
    const { error: updateError } = await (supabase as unknown as {
      from: (table: string) => any;
      update: (data: any) => any;
      eq: (column: string, value: string) => any;
    })
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with tracking details:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update order with tracking information' 
        },
        { status: 500 }
      );
    }

    console.log('Shiprocket tracking updated successfully for order:', orderId);

    return NextResponse.json({
      success: true,
      awbCode: awbCode,
      trackingData: trackingData.tracking_data,
      orderStatus: newOrderStatus,
      statusUpdated: newOrderStatus !== order.status,
      message: 'Tracking information updated successfully'
    });

  } catch (error) {
    console.error('Shiprocket tracking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tracking information from Shiprocket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch tracking for a specific order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('awb_code, shiprocket_order_id')
      .eq('id', orderId)
      .single() as { data: any, error: any };

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.awb_code) {
      return NextResponse.json(
        { success: false, error: 'No AWB code available for this order' },
        { status: 400 }
      );
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Fetch tracking information using AWB code
    const trackingResponse = await fetch(`${SHIPROCKET_TRACKING_URL}/${order.awb_code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!trackingResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tracking information' 
        },
        { status: trackingResponse.status }
      );
    }

    const trackingData = await trackingResponse.json();

    return NextResponse.json({
      success: true,
      trackingData: trackingData.tracking_data,
      awbCode: order.awb_code
    });

  } catch (error) {
    console.error('Shiprocket tracking GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tracking information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
