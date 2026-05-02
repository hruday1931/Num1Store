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

    // Parse shiprocket_order_id to handle both single string and JSON array
    let shiprocketOrderIds: string[] = [];
    try {
      if (order.shiprocket_order_id) {
        // Try to parse as JSON array first
        const parsed = JSON.parse(order.shiprocket_order_id);
        shiprocketOrderIds = Array.isArray(parsed) ? parsed : [order.shiprocket_order_id];
      }
    } catch (error) {
      // If parsing fails, treat it as a single order ID
      shiprocketOrderIds = [order.shiprocket_order_id];
    }

    if (shiprocketOrderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must be created in Shiprocket first' },
        { status: 400 }
      );
    }

    console.log(`Tracking ${shiprocketOrderIds.length} Shiprocket order(s) for order ${orderId}`);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Fetch tracking information for all Shiprocket orders
    const trackingResults = [];
    
    for (const shiprocketOrderId of shiprocketOrderIds) {
      try {
        const trackingResponse = await fetch(`${SHIPROCKET_TRACKING_URL}/${shiprocketOrderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!trackingResponse.ok) {
          const errorData = await trackingResponse.text();
          console.error(`Shiprocket tracking fetch failed for order ${shiprocketOrderId}:`, {
            status: trackingResponse.status,
            statusText: trackingResponse.statusText,
            response: errorData
          });
          
          trackingResults.push({
            shiprocketOrderId,
            success: false,
            error: `Failed to fetch tracking: HTTP ${trackingResponse.status}`
          });
          continue;
        }

        const trackingData = await trackingResponse.json();
        
        trackingResults.push({
          shiprocketOrderId,
          success: true,
          trackingData: trackingData.tracking_data,
          awbCode: trackingData.awb_code || trackingData.tracking_data?.awb_code,
          currentStatus: trackingData.tracking_data?.shipment_status,
          estimatedDelivery: trackingData.tracking_data?.etd
        });
        
      } catch (error) {
        console.error(`Error fetching tracking for order ${shiprocketOrderId}:`, error);
        trackingResults.push({
          shiprocketOrderId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successfulTracking = trackingResults.filter(r => r.success);
    const failedTracking = trackingResults.filter(r => !r.success);

    if (successfulTracking.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tracking information for any Shiprocket order',
          details: failedTracking.map(f => ({ shiprocketOrderId: f.shiprocketOrderId, error: f.error }))
        },
        { status: 500 }
      );
    }

    // Aggregate tracking information
    const awbCodes = successfulTracking
      .map(r => r.awbCode)
      .filter(Boolean);
    
    const statuses = successfulTracking
      .map(r => r.currentStatus)
      .filter(Boolean);
    
    // Determine overall status based on most advanced status
    let overallStatus = order.status;
    if (statuses.length > 0) {
      const hasDelivered = statuses.some(s => s.toLowerCase() === 'delivered');
      const hasOutForDelivery = statuses.some(s => s.toLowerCase() === 'out for delivery');
      const hasInTransit = statuses.some(s => ['in transit', 'dispatched'].includes(s.toLowerCase()));
      
      if (hasDelivered) {
        overallStatus = 'delivered';
      } else if (hasOutForDelivery) {
        overallStatus = 'shipped';
      } else if (hasInTransit && order.status === 'processing') {
        overallStatus = 'shipped';
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Store multiple AWB codes as JSON array
    if (awbCodes.length > 0) {
      updateData.awb_code = JSON.stringify(awbCodes);
    }

    // Store estimated delivery (use the latest one)
    const deliveryDates = successfulTracking
      .map(r => r.estimatedDelivery)
      .filter(Boolean);
    
    if (deliveryDates.length > 0) {
      updateData.estimated_delivery = deliveryDates[deliveryDates.length - 1];
    }

    if (overallStatus !== order.status) {
      updateData.status = overallStatus;
      if (overallStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
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
      message: `Tracking information updated for ${successfulTracking.length} Shiprocket order(s)`,
      results: trackingResults,
      totalOrders: shiprocketOrderIds.length,
      successfulTracking: successfulTracking.length,
      failedTracking: failedTracking.length,
      awbCodes: awbCodes,
      orderStatus: overallStatus,
      statusUpdated: overallStatus !== order.status,
      estimatedDelivery: deliveryDates.length > 0 ? deliveryDates[deliveryDates.length - 1] : null
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

    // Parse awb_code to handle both single string and JSON array
    let awbCodes: string[] = [];
    try {
      if (order.awb_code) {
        // Try to parse as JSON array first
        const parsed = JSON.parse(order.awb_code);
        awbCodes = Array.isArray(parsed) ? parsed : [order.awb_code];
      }
    } catch (error) {
      // If parsing fails, treat it as a single AWB code
      awbCodes = [order.awb_code];
    }

    if (awbCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No AWB code available for this order' },
        { status: 400 }
      );
    }

    console.log(`Fetching tracking for ${awbCodes.length} AWB code(s) for order ${orderId}`);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Fetch tracking information for all AWB codes
    const trackingResults = [];
    
    for (const awbCode of awbCodes) {
      try {
        const trackingResponse = await fetch(`${SHIPROCKET_TRACKING_URL}/${awbCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!trackingResponse.ok) {
          trackingResults.push({
            awbCode,
            success: false,
            error: `Failed to fetch tracking: HTTP ${trackingResponse.status}`
          });
          continue;
        }

        const trackingData = await trackingResponse.json();
        
        trackingResults.push({
          awbCode,
          success: true,
          trackingData: trackingData.tracking_data
        });
        
      } catch (error) {
        console.error(`Error fetching tracking for AWB ${awbCode}:`, error);
        trackingResults.push({
          awbCode,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successfulTracking = trackingResults.filter(r => r.success);
    const failedTracking = trackingResults.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Fetched tracking for ${successfulTracking.length} AWB code(s)`,
      results: trackingResults,
      totalAWBCodes: awbCodes.length,
      successfulTracking: successfulTracking.length,
      failedTracking: failedTracking.length,
      awbCodes: awbCodes
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
