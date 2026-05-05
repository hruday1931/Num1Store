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

    // Group order items by vendor to handle multi-vendor orders
    const vendorGroups = order.order_items.reduce((groups: any, item: any) => {
      const vendorId = item.products?.vendor_id;
      if (!vendorId) return groups;
      
      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendorId,
          items: []
        };
      }
      groups[vendorId].items.push(item);
      return groups;
    }, {});

    const vendorIds = Object.keys(vendorGroups);
    console.log(`Order has ${vendorIds.length} vendor(s): ${vendorIds.join(', ')}`);

    // Get vendor information for all vendors in this order
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, store_name, address_line_1, address_line_2, city, state, pincode')
      .in('id', vendorIds) as { data: any[], error: any };

    if (!vendors || vendors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vendor information not found' },
        { status: 404 }
      );
    }

    // Create vendor lookup map
    const vendorMap = vendors.reduce((map: any, vendor: any) => {
      map[vendor.id] = vendor;
      return map;
    }, {});

    // Create Shiprocket orders for each vendor
    const shiprocketOrders = [];
    
    for (const vendorId of vendorIds) {
      const vendor = vendorMap[vendorId];
      const vendorItems = vendorGroups[vendorId].items;
      
      if (!vendor) {
        console.error(`Vendor ${vendorId} not found in vendor map`);
        continue;
      }

      // Prepare order items for this vendor
      const orderItems: ShiprocketOrderItem[] = vendorItems.map((item: any) => ({
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

      // Calculate total weight and dimensions for this vendor's items
      const totalWeight = orderItems.reduce((sum, item) => sum + (item.weight || 0.5) * item.units, 0);
      const maxDimensions = orderItems.reduce((max, item) => ({
        length: Math.max(max.length, item.length || 10),
        breadth: Math.max(max.breadth, item.breadth || 10),
        height: Math.max(max.height, item.height || 10)
      }), { length: 10, breadth: 10, height: 10 });

      // Format pickup location from vendor's address columns
      let pickupLocation = vendor.store_name || 'Default Warehouse';
      
      // Sanitize pickup location name - remove special characters and spaces
      pickupLocation = pickupLocation
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
        .substring(0, 50); // Limit to 50 characters
      
      // Build address from separate columns
      const addressParts = [
        vendor.address_line_1 || '',
        vendor.address_line_2 || '',
        vendor.city || '',
        vendor.state || '',
        vendor.pincode || ''
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(', ');
        // Use sanitized address if pickup location is just default
        if (pickupLocation === 'Default Warehouse') {
          pickupLocation = fullAddress
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50);
        }
      }

      // Format phone number to exactly 10 digits (no +, no country code)
      const formatPhoneNumber = (phone: string): string => {
        if (!phone) return '0000000000';
        
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '');
        
        // Take last 10 digits (handles cases with country code)
        if (digitsOnly.length >= 10) {
          return digitsOnly.slice(-10);
        }
        
        // If less than 10 digits, pad with zeros
        return digitsOnly.padStart(10, '0');
      };

      // Format pincode - ensure it's a string with exactly 6 digits
      const formatPincode = (pincode: string | number): string => {
        if (!pincode) return '000000';
        
        const pincodeStr = String(pincode).replace(/\D/g, '');
        
        if (pincodeStr.length >= 6) {
          return pincodeStr.slice(0, 6);
        }
        
        return pincodeStr.padStart(6, '0');
      };

      // Prepare Shiprocket order data for this vendor
      const shiprocketOrderData: ShiprocketOrderData = {
        order_id: `ORD-${orderId.slice(-8)}-V${vendorId.slice(-4)}`,
        order_date: new Date(order.created_at).toISOString().split('T')[0],
        pickup_location: pickupLocation,
        billing_customer_name: order.profiles?.full_name || 'Customer',
        billing_address: shippingAddress.address || shippingAddress.street || 'N/A',
        billing_city: shippingAddress.city || 'N/A',
        billing_state: shippingAddress.state || 'N/A',
        billing_pincode: formatPincode(shippingAddress.pincode || shippingAddress.postal_code || '000000'),
        billing_country: shippingAddress.country || 'India',
        billing_email: order.profiles?.email || 'customer@example.com',
        billing_phone: formatPhoneNumber(shippingAddress.phone || order.profiles?.phone || '0000000000'),
        shipping_is_billing: true, // Use billing address for shipping
        order_items: orderItems,
        payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
        sub_total: orderItems.reduce((sum, item) => sum + (item.selling_price * item.units), 0),
        length: maxDimensions.length,
        breadth: maxDimensions.breadth,
        height: maxDimensions.height,
        weight: totalWeight
      };

      shiprocketOrders.push({
        vendorId,
        orderData: shiprocketOrderData,
        items: vendorItems
      });
    }

    if (shiprocketOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid vendor orders found' },
        { status: 400 }
      );
    }

    console.log(`Creating ${shiprocketOrders.length} Shiprocket order(s) for multi-vendor order`);

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Create orders in Shiprocket for each vendor
    const shiprocketResults = [];
    const shiprocketOrderIds = [];
    
    for (const shiprocketOrder of shiprocketOrders) {
      try {
        // Log the exact data being sent to Shiprocket for debugging
        console.log(`Sending Shiprocket order for vendor ${shiprocketOrder.vendorId}:`, {
          url: SHIPROCKET_ORDERS_URL,
          orderData: shiprocketOrder.orderData,
          dataSummary: {
            orderId: shiprocketOrder.orderData.order_id,
            pickupLocation: shiprocketOrder.orderData.pickup_location,
            billingPhone: shiprocketOrder.orderData.billing_phone,
            billingPincode: shiprocketOrder.orderData.billing_pincode,
            paymentMethod: shiprocketOrder.orderData.payment_method,
            itemCount: shiprocketOrder.orderData.order_items.length
          }
        });

        const response = await fetch(SHIPROCKET_ORDERS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(shiprocketOrder.orderData)
        });

        if (!response.ok) {
          const errorData = await response.text();
          let errorJson = null;
          
          try {
            errorJson = JSON.parse(errorData);
          } catch (e) {
            // Keep errorData as text if it's not valid JSON
          }
          
          console.error(`Shiprocket order creation failed for vendor ${shiprocketOrder.vendorId}:`, {
            status: response.status,
            statusText: response.statusText,
            errorResponse: errorJson || errorData,
            orderData: shiprocketOrder.orderData,
            pickupLocation: shiprocketOrder.orderData.pickup_location,
            billingPhone: shiprocketOrder.orderData.billing_phone,
            billingPincode: shiprocketOrder.orderData.billing_pincode
          });
          
          shiprocketResults.push({
            vendorId: shiprocketOrder.vendorId,
            success: false,
            error: `Failed to create order: HTTP ${response.status} - ${errorJson?.message || response.statusText}`,
            errorDetails: errorJson || errorData,
            orderData: shiprocketOrder.orderData
          });
          continue;
        }

        const result = await response.json();
        
        shiprocketResults.push({
          vendorId: shiprocketOrder.vendorId,
          success: true,
          shiprocketOrderId: result.order_id?.toString(),
          shipmentId: result.shipment_id,
          status: result.status,
          orderData: shiprocketOrder.orderData
        });
        
        if (result.order_id) {
          shiprocketOrderIds.push(result.order_id.toString());
        }
        
        console.log(`Shiprocket order created successfully for vendor ${shiprocketOrder.vendorId}:`, result.order_id);
        
      } catch (error) {
        console.error(`Error creating Shiprocket order for vendor ${shiprocketOrder.vendorId}:`, error);
        shiprocketResults.push({
          vendorId: shiprocketOrder.vendorId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          orderData: shiprocketOrder.orderData
        });
      }
    }

    // Check if at least one order was created successfully
    const successfulOrders = shiprocketResults.filter(r => r.success);
    const failedOrders = shiprocketResults.filter(r => !r.success);
    
    if (successfulOrders.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create any Shiprocket orders',
          details: failedOrders.map(f => ({ vendorId: f.vendorId, error: f.error }))
        },
        { status: 500 }
      );
    }

    // Update order with Shiprocket details (store all order IDs as JSON array)
    const { error: updateError } = await (supabase as unknown as {
      from: (table: string) => any;
      update: (data: any) => any;
      eq: (column: string, value: string) => any;
    })
      .from('orders')
      .update({
        shiprocket_order_id: JSON.stringify(shiprocketOrderIds),
        pickup_status: successfulOrders.length === shiprocketOrders.length ? 'requested' : 'partial',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Shiprocket details:', updateError);
      // Don't fail the response, but log the error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${successfulOrders.length} Shiprocket order(s) for ${shiprocketOrders.length} vendor(s)`,
      results: shiprocketResults,
      totalOrders: shiprocketOrders.length,
      successfulOrders: successfulOrders.length,
      failedOrders: failedOrders.length,
      shiprocketOrderIds: shiprocketOrderIds,
      pickupStatus: successfulOrders.length === shiprocketOrders.length ? 'requested' : 'partial'
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
