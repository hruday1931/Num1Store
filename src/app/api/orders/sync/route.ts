import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// API endpoint to automatically sync orders with Shiprocket
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            vendor_id,
            weight,
            dimensions
          )
        ),
        profiles!orders_customer_id_fkey (
          email,
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single() as { data: any, error: any };

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already synced
    if (order.shiprocket_order_id) {
      return NextResponse.json({
        success: true,
        message: 'Order already synced with Shiprocket',
        shiprocketOrderId: order.shiprocket_order_id
      });
    }

    // Check if order is in a status that can be synced
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return NextResponse.json(
        { success: false, error: 'Cannot sync cancelled or refunded orders' },
        { status: 400 }
      );
    }

    // Check if payment is confirmed (for prepaid orders)
    if (order.payment_method === 'online' && order.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment must be confirmed before syncing' },
        { status: 400 }
      );
    }

    // Parse shipping address
    let shippingAddress;
    try {
      shippingAddress = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;
    } catch (error) {
      console.error('Error parsing shipping address:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid shipping address format' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['address', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required shipping information: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Get vendor information
    const { data: vendor } = await supabase
      .from('vendors')
      .select('store_name, pickup_address')
      .eq('id', order.order_items[0]?.products?.vendor_id)
      .single() as { data: any, error: any };

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor information not found' },
        { status: 404 }
      );
    }

    // Create order in Shiprocket
    const shiprocketResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shiprocket/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId })
    });

    const shiprocketResult = await shiprocketResponse.json();

    if (!shiprocketResult.success) {
      console.error('Shiprocket sync failed:', shiprocketResult);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to sync order with Shiprocket',
          details: shiprocketResult.error 
        },
        { status: 500 }
      );
    }

    // Update order with sync status
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    console.log('Order synced with Shiprocket successfully:', orderId);

    return NextResponse.json({
      success: true,
      message: 'Order automatically synced with Shiprocket',
      shiprocketOrderId: shiprocketResult.shiprocketOrderId,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Order sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync order with Shiprocket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
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

    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('shiprocket_order_id, awb_code, synced_at, status')
      .eq('id', orderId)
      .single() as { data: any, error: any };

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isSynced: !!order.shiprocket_order_id,
      shiprocketOrderId: order.shiprocket_order_id,
      awbCode: order.awb_code,
      syncedAt: order.synced_at,
      status: order.status
    });

  } catch (error) {
    console.error('Sync status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
