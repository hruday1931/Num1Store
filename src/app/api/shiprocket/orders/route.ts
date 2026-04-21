import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Shiprocket API endpoints
const SHIPROCKET_ORDERS_URL = 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc';

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

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

interface ShiprocketOrderData {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_country: string;
  billing_email?: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
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

    // Get order details with items
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

    // Get vendor information for pickup location
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

    // Prepare order items for Shiprocket
    const orderItems: ShiprocketOrderItem[] = order.order_items.map((item: any) => ({
      name: item.products.name,
      sku: `PRD-${item.products.id.slice(-8)}`,
      units: item.quantity,
      selling_price: item.price,
      // Use default dimensions if not specified
      length: item.products.dimensions?.length || 10,
      breadth: item.products.dimensions?.breadth || 10,
      height: item.products.dimensions?.height || 10,
      weight: item.products.weight || 0.5
    }));

    // Calculate total weight and dimensions
    const totalWeight = orderItems.reduce((sum, item) => sum + (item.weight || 0.5) * item.units, 0);
    const maxDimensions = orderItems.reduce((max, item) => ({
      length: Math.max(max.length, item.length || 10),
      breadth: Math.max(max.breadth, item.breadth || 10),
      height: Math.max(max.height, item.height || 10)
    }), { length: 10, breadth: 10, height: 10 });

    // Prepare Shiprocket order data
    const shiprocketOrderData: ShiprocketOrderData = {
      order_id: `ORD-${orderId.slice(-8)}`,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: vendor.pickup_address || vendor.store_name || 'Default Warehouse',
      billing_customer_name: order.profiles?.full_name || 'Customer',
      billing_address: shippingAddress.address || shippingAddress.street || 'N/A',
      billing_city: shippingAddress.city || 'N/A',
      billing_state: shippingAddress.state || 'N/A',
      billing_pincode: shippingAddress.pincode || shippingAddress.postal_code || '000000',
      billing_country: shippingAddress.country || 'India',
      billing_email: order.profiles?.email || 'customer@example.com',
      billing_phone: shippingAddress.phone || order.profiles?.phone || '0000000000',
      shipping_is_billing: true, // Use billing address for shipping
      order_items: orderItems,
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.total_amount,
      length: maxDimensions.length,
      breadth: maxDimensions.breadth,
      height: maxDimensions.height,
      weight: totalWeight
    };

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Create order in Shiprocket
    const shiprocketResponse = await fetch(SHIPROCKET_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(shiprocketOrderData)
    });

    if (!shiprocketResponse.ok) {
      const errorData = await shiprocketResponse.text();
      console.error('Shiprocket order creation failed:', {
        status: shiprocketResponse.status,
        statusText: shiprocketResponse.statusText,
        response: errorData
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create order in Shiprocket',
          details: `HTTP ${shiprocketResponse.status}: ${shiprocketResponse.statusText}`
        },
        { status: shiprocketResponse.status }
      );
    }

    const shiprocketResult = await shiprocketResponse.json();

    // Update order with Shiprocket details
    const { error: updateError } = await (supabase as unknown as {
      from: (table: string) => any;
      update: (data: any) => any;
      eq: (column: string, value: string) => any;
    })
      .from('orders')
      .update({
        shiprocket_order_id: shiprocketResult.order_id?.toString(),
        pickup_status: 'requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Shiprocket details:', updateError);
      // Don't fail the response, but log the error
    }

    console.log('Shiprocket order created successfully:', shiprocketResult.order_id);

    return NextResponse.json({
      success: true,
      shiprocketOrderId: shiprocketResult.order_id,
      shipmentId: shiprocketResult.shipment_id,
      status: shiprocketResult.status,
      message: 'Order successfully created in Shiprocket'
    });

  } catch (error) {
    console.error('Shiprocket order creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order in Shiprocket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
