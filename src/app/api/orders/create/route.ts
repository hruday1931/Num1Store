import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Enhanced order creation API with automatic Shiprocket sync
export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Validate required fields
    const requiredFields = ['customer_id', 'total_amount', 'items'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Start a transaction-like operation
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        customer_id: orderData.customer_id,
        total_amount: orderData.total_amount,
        status: 'pending',
        payment_method: orderData.payment_method || 'online',
        payment_status: 'pending',
        shipping_address: orderData.shipping_address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single() as { data: any, error: any };

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await (supabase as any)
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Rollback order creation
      await (supabase as any).from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { success: false, error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Update order status to processing
    const { error: statusError } = await (supabase as any)
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', order.id);

    if (statusError) {
      console.error('Order status update error:', statusError);
    }

    // Auto-sync with Shiprocket for prepaid orders or COD orders with confirmed payment
    const shouldAutoSync = 
      (orderData.payment_method === 'online' && orderData.payment_status === 'paid') ||
      orderData.payment_method === 'cod';

    let shiprocketSyncResult = null;
    if (shouldAutoSync) {
      try {
        // Small delay to ensure order is fully committed
        await new Promise(resolve => setTimeout(resolve, 1000));

        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders/sync-multi-vendor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: order.id })
        });

        shiprocketSyncResult = await syncResponse.json();
        
        if (shiprocketSyncResult.success) {
          console.log('Order auto-synced with Shiprocket:', order.id);
        } else {
          console.warn('Auto-sync failed:', shiprocketSyncResult.error);
        }
      } catch (syncError) {
        console.error('Auto-sync error:', syncError);
        // Don't fail the order creation if sync fails
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        created_at: order.created_at
      },
      shiprocketSync: shiprocketSyncResult,
      message: 'Order created successfully' + 
        (shiprocketSyncResult?.success ? ' and synced with Shiprocket' : '')
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
