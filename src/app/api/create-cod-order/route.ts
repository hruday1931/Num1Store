import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

export async function POST(request: NextRequest) {
  console.log('=== COD ORDER API DEBUG ===');
  console.log('API route called at:', new Date().toISOString());
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  
  try {
    const requestBody = await request.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { cartItems, shippingAddress, userId, totalAmount } = requestBody;
    
    console.log('Extracted values:', {
      cartItems: cartItems,
      shippingAddress: !!shippingAddress,
      userId: userId,
      totalAmount: totalAmount,
      totalAmountType: typeof totalAmount
    });

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('COD Order API: Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('COD Order API: No valid Authorization header found');
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
    
    // Create a Supabase client with the Bearer token for authentication
    console.log('COD Order API: Creating Supabase client with Bearer token...');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    // Validate the token
    console.log('COD Order API: Validating token...');
    const { data: tokenUser, error: tokenError } = await supabase.auth.getUser(token);
    console.log('COD Order API - Token validation result:', { tokenUser, tokenError });
    
    if (tokenError) {
      console.error('COD Order API: Token validation failed:', tokenError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid authentication token: ${tokenError.message}`,
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }
    
    const user = tokenUser.user;
    
    if (!user) {
      console.error('COD Order Auth Error: User verification failed');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authentication token. Please sign in again.',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Verify that the authenticated user matches the provided userId
    if (user.id !== userId) {
      console.error('COD Order API: User ID mismatch', { authenticatedUserId: user.id, providedUserId: userId });
      return NextResponse.json(
        { 
          success: false, 
          error: 'User authentication mismatch. Please sign in again.',
          code: 'USER_MISMATCH'
        },
        { status: 401 }
      );
    }

    // Verify user exists in auth.users (this should always be true if auth succeeded)
    console.log('COD Order API: Verifying user exists in database...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (userCheckError) {
      console.error('COD Order API: User profile check failed:', userCheckError);
      // Try to create the user profile if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({ id: user.id })
        .select('id')
        .single();
      
      if (createProfileError) {
        console.error('COD Order API: Failed to create user profile:', createProfileError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'User profile not found and could not be created. Please sign out and sign in again.',
            code: 'PROFILE_CREATION_FAILED'
          },
          { status: 400 }
        );
      }
      
      console.log('COD Order API: Created user profile:', newProfile);
    } else {
      console.log('COD Order API: User profile exists:', userCheck);
    }

    // Get product details and validate
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) {
      console.error('COD Order API - Products Error:', productsError);
      return NextResponse.json(
        { success: false, error: `Failed to fetch product details: ${productsError.message}` },
        { status: 500 }
      );
    }

    // Validate cart items and calculate total
    let calculatedTotal = 0;
    const validatedCartItems = cartItems.map((item: CartItem) => {
      const product = (products as any[])?.find((p: any) => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      
      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;
      
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      };
    });

    // Validate total amount
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.error('COD Order API - Amount mismatch:', { calculated: calculatedTotal, received: totalAmount });
      return NextResponse.json(
        { success: false, error: `Cart total mismatch. Expected: ₹${calculatedTotal.toFixed(2)}, Received: ₹${totalAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Use database function for transactional order creation
    const orderItemsJson = validatedCartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    console.log('COD Order API - Creating order with items:', {
      customer_id: user.id,
      total_amount: totalAmount,
      payment_method: 'cod',
      payment_status: 'pending',
      items: orderItemsJson
    });

    const shippingAddressStr = JSON.stringify(shippingAddress);
    const params = {
      p_customer_id: user.id,
      p_total_amount: totalAmount,
      p_status: 'pending',
      p_payment_method: 'cod',
      p_payment_status: 'pending',
      p_shipping_address: shippingAddressStr,
      p_order_items: orderItemsJson
    };

    console.log('Final Params:', params); // Debug log as requested
    console.log('COD Order API - Calling database function with params:', {
      p_customer_id: user.id,
      p_total_amount: totalAmount,
      p_total_amount_type: typeof totalAmount,
      p_status: 'pending',
      p_payment_method: 'cod',
      p_payment_status: 'pending',
      p_shipping_address: shippingAddressStr,
      p_shipping_address_type: typeof shippingAddressStr,
      p_order_items: orderItemsJson,
      p_order_items_count: orderItemsJson.length
    });

    // Use raw SQL to explicitly call the function with text casting to resolve ambiguity
    const { data: orderResult, error: orderError } = await supabase
      .rpc('create_order_with_items', {
        p_customer_id: user.id,
        p_total_amount: totalAmount,
        p_status: 'pending',
        p_payment_method: 'cod',
        p_payment_status: 'pending',
        p_shipping_address: shippingAddressStr,
        p_order_items: orderItemsJson
      });

    console.log('COD Order API - Database function response:', {
      orderResult: orderResult,
      orderResultType: typeof orderResult,
      orderResultLength: orderResult?.length,
      orderError: orderError,
      orderErrorDetails: orderError ? {
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code
      } : null
    });

    if (orderError) {
      console.error('COD Order Creation Error:', orderError);
      return NextResponse.json(
        { success: false, error: `Failed to create order: ${orderError.message}. Please try again.` },
        { status: 500 }
      );
    }

    // Check if the function returned success
    if (!orderResult || orderResult.length === 0) {
      console.error('COD Order Function Error: No result returned from database function');
      return NextResponse.json(
        { success: false, error: 'No response from database function. Please try again.' },
        { status: 500 }
      );
    }

    console.log('COD Order API - Analyzing function result:', {
      firstResult: orderResult[0],
      resultKeys: orderResult[0] ? Object.keys(orderResult[0]) : 'No keys',
      hasSuccess: orderResult[0] && typeof orderResult[0] === 'object' ? 'success' in orderResult[0] : false,
      successValue: orderResult[0] && typeof orderResult[0] === 'object' ? orderResult[0].success : 'N/A',
      hasErrorMessage: orderResult[0] && typeof orderResult[0] === 'object' ? 'error_message' in orderResult[0] : false,
      errorMessage: orderResult[0] && typeof orderResult[0] === 'object' ? orderResult[0].error_message : 'N/A'
    });

    // Handle different response formats from the database function
    let success = false;
    let orderId = null;
    let errorMsg = 'Unknown error occurred during order creation';

    if (typeof orderResult[0] === 'object' && orderResult[0] !== null) {
      if ('success' in orderResult[0]) {
        success = orderResult[0].success;
        if (success && 'order_id' in orderResult[0]) {
          orderId = orderResult[0].order_id;
        } else if (!success && 'error_message' in orderResult[0]) {
          errorMsg = orderResult[0].error_message;
        }
      } else if (typeof orderResult[0] === 'string') {
        // If the function returns a string ID directly
        orderId = orderResult[0];
        success = true;
      }
    } else if (typeof orderResult[0] === 'string') {
      // If the function returns a string ID directly
      orderId = orderResult[0];
      success = true;
    }

    if (!success || !orderId) {
      console.error('COD Order Function Error:', errorMsg);
      return NextResponse.json(
        { success: false, error: `Failed to create order: ${errorMsg}` },
        { status: 500 }
      );
    }

    console.log('COD Order and items created successfully:', orderId);

    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: 'COD order created successfully'
    });

  } catch (error) {
    console.error('=== COD ORDER CATCH BLOCK ERROR ===');
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Final error message to return:', errorMessage);
    
    // CRITICAL: Always return NextResponse.json, never new Response()
    return NextResponse.json(
      { success: false, error: `Failed to create COD order: ${errorMessage}` },
      { status: 500 }
    );
  }
}
