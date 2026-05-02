import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { shiprocketService } from '@/lib/shiprocket';

// Enhanced multi-vendor order sync API
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

    // Get order details with vendor information
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
            dimensions,
            sku
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

    // Group order items by vendor
    const vendorGroups = new Map();
    
    for (const orderItem of order.order_items) {
      const vendorId = orderItem.products?.vendor_id;
      
      if (!vendorId) {
        console.warn('Order item has no vendor:', orderItem.id);
        continue;
      }
      
      if (!vendorGroups.has(vendorId)) {
        vendorGroups.set(vendorId, {
          vendorId,
          items: []
        });
      }
      
      vendorGroups.get(vendorId).items.push({
        name: orderItem.products.name,
        sku: orderItem.products.sku,
        quantity: orderItem.quantity,
        price: orderItem.price,
        weight: orderItem.products.weight,
        dimensions: orderItem.products.dimensions
      });
    }

    if (vendorGroups.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid vendor items found in order' },
        { status: 400 }
      );
    }

    // Get vendor information including location_tag
    const vendorIds = Array.from(vendorGroups.keys());
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, store_name, location_tag, pickup_location_registered')
      .in('id', vendorIds) as { data: any[], error: any };

    if (vendorError || !vendors || vendors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vendor information not found' },
        { status: 404 }
      );
    }

    // Check if all vendors have registered pickup locations
    const vendorsWithoutPickup = vendors.filter(v => !v.pickup_location_registered || !v.location_tag);
    if (vendorsWithoutPickup.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Vendors ${vendorsWithoutPickup.map(v => v.store_name).join(', ')} must register pickup locations before order can be synced` 
        },
        { status: 400 }
      );
    }

    // Create vendor groups with location tags
    const vendorGroupsForShipment = Array.from(vendorGroups.values()).map(group => {
      const vendor = vendors.find(v => v.id === group.vendorId);
      return {
        vendorId: group.vendorId,
        locationTag: vendor!.location_tag,
        items: group.items.map((item: any) => ({
          ...item,
          // Parse dimensions if available
          length: item.dimensions?.length || 10,
          breadth: item.dimensions?.breadth || 10,
          height: item.dimensions?.height || 5,
        }))
      };
    });

    // Prepare customer information
    const customerInfo = {
      name: order.profiles.full_name || 'Customer',
      email: order.profiles.email || 'customer@example.com',
      phone: order.profiles.phone || '',
      address: shippingAddress.address,
      address_2: shippingAddress.address_2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country || 'India',
      pincode: shippingAddress.pincode
    };

    // Create multi-vendor shipments
    const shipmentResults = await shiprocketService.createMultiVendorShipments({
      orderId: orderId.toString(),
      customerInfo,
      vendorGroups: vendorGroupsForShipment,
      paymentMethod: order.payment_method || 'COD',
      orderDate: order.created_at
    });

    // Check if all shipments were created successfully
    const failedShipments = shipmentResults.filter(r => !r.success);
    const successfulShipments = shipmentResults.filter(r => r.success);

    if (failedShipments.length > 0) {
      console.error('Some shipments failed:', failedShipments);
      
      // If some succeeded, update order with partial success
      if (successfulShipments.length > 0) {
        await (supabase as any)
          .from('orders')
          .update({
            shiprocket_order_id: `MULTI_${orderId}`,
            synced_at: new Date().toISOString(),
            sync_status: 'partial',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        return NextResponse.json({
          success: false,
          error: 'Partial sync completed - some vendor shipments failed',
          successfulShipments: successfulShipments.length,
          failedShipments: failedShipments.length,
          details: failedShipments.map(f => ({ vendorId: f.vendorId, error: f.error }))
        }, { status: 207 }); // 207 Multi-Status
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'All vendor shipments failed',
          details: failedShipments.map(f => ({ vendorId: f.vendorId, error: f.error }))
        },
        { status: 500 }
      );
    }

    // Update order with sync status
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({
        shiprocket_order_id: `MULTI_${orderId}`,
        synced_at: new Date().toISOString(),
        sync_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    console.log(`Multi-vendor order synced successfully: ${orderId} (${successfulShipments.length} shipments)`);

    return NextResponse.json({
      success: true,
      message: 'Multi-vendor order synced successfully with Shiprocket',
      shiprocketOrderId: `MULTI_${orderId}`,
      shipmentsCreated: successfulShipments.length,
      shipmentDetails: successfulShipments.map(s => ({
        vendorId: s.vendorId,
        shipmentId: s.shipment?.shipment_id,
        awbCode: s.shipment?.awb_code
      })),
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multi-vendor order sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync multi-vendor order with Shiprocket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
