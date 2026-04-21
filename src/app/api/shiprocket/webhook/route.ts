import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Shiprocket webhook handler for automatic order status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Shiprocket webhook received:', body);

    // Verify webhook signature (if Shiprocket provides one)
    // const signature = request.headers.get('x-shiprocket-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const supabase = await createClient();

    // Handle different webhook events
    switch (body.event) {
      case 'order_status_updated':
        await handleOrderStatusUpdate(body.data, supabase);
        break;
      
      case 'shipment_created':
        await handleShipmentCreated(body.data, supabase);
        break;
      
      case 'tracking_updated':
        await handleTrackingUpdate(body.data, supabase);
        break;
      
      case 'order_delivered':
        await handleOrderDelivered(body.data, supabase);
        break;
      
      default:
        console.log('Unhandled webhook event:', body.event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleOrderStatusUpdate(data: any, supabase: any) {
  const { order_id, status, awb_code, courier_name, estimated_delivery } = data;

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (status) {
    // Map Shiprocket status to our status
    let orderStatus = 'processing';
    switch (status.toLowerCase()) {
      case 'delivered':
        orderStatus = 'delivered';
        updateData.delivered_at = new Date().toISOString();
        break;
      case 'in transit':
      case 'dispatched':
        orderStatus = 'shipped';
        break;
      case 'out for delivery':
        orderStatus = 'shipped';
        break;
      case 'pending':
        orderStatus = 'processing';
        break;
    }
    updateData.status = orderStatus;
  }

  if (awb_code) updateData.awb_code = awb_code;
  if (courier_name) updateData.courier_name = courier_name;
  if (estimated_delivery) updateData.estimated_delivery = estimated_delivery;

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('shiprocket_order_id', order_id.toString());

  if (error) {
    console.error('Error updating order status:', error);
  } else {
    console.log(`Order ${order_id} status updated to ${status}`);
  }
}

async function handleShipmentCreated(data: any, supabase: any) {
  const { order_id, shipment_id, awb_code, courier_name, etd } = data;

  const updateData = {
    shipment_id,
    awb_code,
    courier_name,
    pickup_status: 'scheduled',
    estimated_delivery: etd ? new Date(etd).toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('shiprocket_order_id', order_id.toString());

  if (error) {
    console.error('Error updating shipment data:', error);
  } else {
    console.log(`Shipment ${shipment_id} created for order ${order_id}`);
  }
}

async function handleTrackingUpdate(data: any, supabase: any) {
  const { awb_code, tracking_data } = data;

  if (!tracking_data) return;

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (tracking_data.current_location) {
    updateData.current_location = tracking_data.current_location;
  }

  if (tracking_data.etd) {
    updateData.estimated_delivery = new Date(tracking_data.etd).toISOString();
  }

  // Update status based on tracking
  let newStatus = null;
  switch (tracking_data.shipment_status?.toLowerCase()) {
    case 'delivered':
      newStatus = 'delivered';
      updateData.delivered_at = new Date().toISOString();
      break;
    case 'in transit':
    case 'dispatched':
      newStatus = 'shipped';
      break;
    case 'out for delivery':
      newStatus = 'shipped';
      break;
  }

  if (newStatus) {
    updateData.status = newStatus;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('awb_code', awb_code);

  if (error) {
    console.error('Error updating tracking data:', error);
  } else {
    console.log(`Tracking updated for AWB ${awb_code}`);
  }
}

async function handleOrderDelivered(data: any, supabase: any) {
  const { order_id, delivery_date } = data;

  const updateData = {
    status: 'delivered',
    delivered_at: delivery_date ? new Date(delivery_date).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('shiprocket_order_id', order_id.toString());

  if (error) {
    console.error('Error marking order as delivered:', error);
  } else {
    console.log(`Order ${order_id} marked as delivered`);
  }
}

// Helper function to verify webhook signature (if needed)
// function verifyWebhookSignature(body: any, signature: string): boolean {
//   const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
//   if (!secret || !signature) return false;
//   
//   const crypto = require('crypto');
//   const expectedSignature = crypto
//     .createHmac('sha256', secret)
//     .update(JSON.stringify(body))
//     .digest('hex');
//   
//   return signature === expectedSignature;
// }
