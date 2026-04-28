import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: {
    price: number;
  };
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderItem {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

interface DatabaseOrder {
  user_id: string;
  total_amount: number;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    if (!shippingAddress || shippingAddress.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Get environment variables at runtime
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!razorpayKeySecret) {
      console.error('Missing Razorpay key secret');
      return NextResponse.json(
        { error: 'Payment service configuration error' },
        { status: 500 }
      );
    }
    
    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('Verify Payment API: Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Verify Payment API: No valid Authorization header found');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authorization token required. Please sign in again.',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Use getUser() with the token for verification
    console.log('Verify Payment API: Verifying user with token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log('Verify Payment API: User verification result:', user ? 'Success' : 'Failed');
    console.log('Verify Payment API: User error:', userError?.message || 'None');
    console.log('Verify Payment API: User ID:', user?.id || 'Not found');
    
    if (userError || !user) {
      console.error('Payment Verification Auth Error:', userError?.message || 'User verification failed');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authentication token. Please sign in again.',
          code: 'AUTHENTICATION_REQUIRED',
          details: {
            userError: userError?.message,
            hasUser: !!user,
            userId: user?.id
          }
        },
        { status: 401 }
      );
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user.id) as { data: CartItem[]; error: any };

    if (cartError) {
      console.error('Cart Error:', cartError.message);
      return NextResponse.json(
        { success: false, error: `Failed to fetch cart items: ${cartError.message}` },
        { status: 500 }
      );
    }

    // Fetch product data separately since relationship query was removed
    let productsData: any = {};
    if (cartItems && cartItems.length > 0) {
      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);
      
      if (productsError) {
        console.error('Products fetch error:', productsError);
        return NextResponse.json(
          { success: false, error: `Failed to fetch product data: ${productsError.message}` },
          { status: 500 }
        );
      }
      
      // Create a lookup map for products
      productsData = (products || []).reduce((acc: any, product: any) => {
        acc[product.id] = product;
        return acc;
      }, {});
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate total amount using fetched product data
    const totalAmount = cartItems.reduce((sum: number, item: CartItem) => {
      const product = productsData[item.product_id];
      const price = product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // Create order
    const orderData: DatabaseOrder = {
      user_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
    };

    const { data: order, error: orderError } = await (supabase
      .from('orders')
      .insert(orderData as any)
      .select()
      .single()) as { data: Order; error: any };

    if (orderError || !order) {
      console.error('Order Creation Error:', orderError?.message || 'Unknown error');
      return NextResponse.json(
        { success: false, error: `Failed to create order: ${orderError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems: OrderItem[] = cartItems.map((item: CartItem) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product?.price || 0,
    }));

    const { error: orderItemsError } = await (supabase
      .from('order_items')
      .insert(orderItems as any)) as { error: any };

    if (orderItemsError) {
      console.error('Order Items Error:', orderItemsError.message);
      return NextResponse.json(
        { success: false, error: `Failed to create order items: ${orderItemsError.message}` },
        { status: 500 }
      );
    }

    // Clear cart
    await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.id);

    // Sync order with Shiprocket for automated shipping
    try {
      console.log('Syncing order with Shiprocket:', order.id);
      const shiprocketResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shiprocket/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id
        })
      });

      if (shiprocketResponse.ok) {
        const shiprocketData = await shiprocketResponse.json();
        console.log('Shiprocket sync successful:', shiprocketData);
      } else {
        console.error('Shiprocket sync failed:', await shiprocketResponse.text());
        // Don't fail the payment verification if Shiprocket sync fails
      }
    } catch (shiprocketError) {
      console.error('Error syncing with Shiprocket:', shiprocketError);
      // Don't fail the payment verification if Shiprocket sync fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Verification Error Details:', errorMessage);
    return NextResponse.json(
      { success: false, error: `Payment verification failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
