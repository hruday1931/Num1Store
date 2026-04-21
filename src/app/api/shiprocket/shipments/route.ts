// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { shiprocketService } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get order details with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products:product_id (
          name,
          weight,
          length,
          breadth,
          height
        )
      `)
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      console.error('Order items fetch error:', itemsError);
      return NextResponse.json({
        success: false,
        error: 'Order items not found'
      }, { status: 404 });
    }

    // Convert order data to Shiprocket format
    const shipmentData = (shiprocketService as any).constructor.convertOrderToShipment(order, orderItems);

    // Create shipment with Shiprocket
    const shipment = await shiprocketService.createShipment(shipmentData);

    // Generate pickup automatically
    const pickup = await shiprocketService.generatePickup([shipment.shipment_id]);

    // Update order with Shiprocket data
    const adminClient = createServiceRoleClient();
    const updateData = {
      shipment_id: shipment.shipment_id,
      awb_code: shipment.awb_code,
      shiprocket_order_id: shipment.shipment_id.toString(),
      courier_name: shipment.courier_name,
      pickup_status: 'scheduled',
      estimated_delivery: shipment.etd ? new Date(shipment.etd).toISOString() : null,
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await adminClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update order with shipment data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shipment: {
        shipment_id: shipment.shipment_id,
        awb_code: shipment.awb_code,
        courier_name: shipment.courier_name,
        status: shipment.status,
        etd: shipment.etd
      },
      pickup: {
        pickup_id: pickup.pickup_id,
        scheduled_date: pickup.scheduled_date,
        pickup_time: pickup.pickup_time,
        status: pickup.status
      }
    });

  } catch (error) {
    console.error('Shipment creation error:', error);
    
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Detailed error information:', {
      message: errorMessage,
      details: errorDetails,
      orderId: orderId,
      timestamp: new Date().toISOString()
    });
    
    // Check for common issues
    if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
      return NextResponse.json({
        success: false,
        error: 'Shiprocket authentication failed. Please check API credentials.'
      }, { status: 500 });
    }
    
    if (errorMessage.includes('customer') || errorMessage.includes('address')) {
      return NextResponse.json({
        success: false,
        error: 'Customer address information is missing. Please ensure order has complete customer details.'
      }, { status: 400 });
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('required')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shipment data. Please check order details and try again.'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: `Failed to create shipment: ${errorMessage}`
    }, { status: 500 });
  }
}
