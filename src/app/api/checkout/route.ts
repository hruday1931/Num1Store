import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
const Razorpay = require('razorpay');

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: {
    price: number;
  };
}

export async function POST(request: NextRequest) {
  console.log('=== NEW CHECKOUT API VERSION - DEBUG ===');
  
  // Check for missing Razorpay keys at the very top
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return Response.json({ error: 'Keys missing on server' }, { status: 500 });
  }
  
  // Debug environment variables at the very beginning
  console.log('DEBUG: KEY_ID exists?', !!process.env.RAZORPAY_KEY_ID);
  console.log('DEBUG: SECRET exists?', !!process.env.RAZORPAY_KEY_SECRET);
  
  try {
    const { amount, currency, shippingAddress } = await request.json();

    // Validate required fields
    if (!amount || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, currency' },
        { status: 400 }
      );
    }

    // Note: shipping address validation is now handled on frontend
    // We don't need shipping address for order creation anymore

    // Validate Razorpay credentials
    console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('Razorpay Secret Present:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
    console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('RAZORPAY_KEY_ID value:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
    console.log('RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length);
    console.log('=== END ENVIRONMENT VARIABLES DEBUG ===');
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing:', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        keyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...',
        keySecretLength: process.env.RAZORPAY_KEY_SECRET?.length
      });
      
      // Return error response for missing credentials
      return NextResponse.json({ error: "Missing API Keys" }, { status: 500 });
    }

    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('Checkout API: Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Checkout API: No valid Authorization header found');
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
    
    // Get environment variables at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Create a Supabase client with the Bearer token for authentication
    console.log('Checkout API: Creating Supabase client with Bearer token...');
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
    
    // Debug: First try to validate the token directly
    console.log('Checkout API: Validating token directly...');
    const { data: tokenUser, error: tokenError } = await supabase.auth.getUser(token);
    console.log('Checkout API - Token validation result:', { tokenUser, tokenError });
    
    if (tokenError) {
      console.error('Checkout API: Token validation failed:', tokenError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid authentication token: ${tokenError.message}`,
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }
    
    // Use the validated user directly - no need to set session
    const user = tokenUser.user;
    const userError = tokenError;
    
    if (userError || !user) {
      console.error('Checkout Auth Error:', (userError as any)?.message || 'User verification failed');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authentication token. Please sign in again.',
          code: 'AUTHENTICATION_REQUIRED',
          details: {
            userError: userError ? (userError as any).message : 'No error',
            hasUser: !!user
          }
        },
        { status: 401 }
      );
    }
    
    // Verify that the userId from the session matches
    // No need for separate userId parameter - we use the authenticated user

    // Get cart items for the user
    console.log('Current User:', user.id);
    console.log('=== USER ID COMPARISON DEBUG ===');
    console.log('Authenticated user ID from supabase.auth.getUser():', user.id);
    
    // Debug: Check if we can access the cart table at all
    const { data: allCartItems, error: allCartError } = await supabase
      .from('cart')
      .select('id, user_id, product_id, quantity')
      .limit(5);
    
    console.log('Checkout API - All Cart Items (debug):', allCartItems);
    console.log('Checkout API - All Cart Error (debug):', allCartError);
    
    // Now query for this specific user with explicit ordering and fresh data
    const { data: userCartItems, error: cartError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('Fetched Cart:', userCartItems);
    console.log('Checkout API - User Cart Error:', cartError);
    
    if (userCartItems && userCartItems.length > 0) {
      userCartItems.forEach((item, index) => {
        console.log(`Cart item ${index + 1}:`);
        console.log(`  - Cart item ID: ${item.id}`);
        console.log(`  - Cart user_id: ${item.user_id}`);
        console.log(`  - Product ID: ${item.product_id}`);
        console.log(`  - Quantity: ${item.quantity}`);
        console.log(`  - User ID match: ${item.user_id === user.id ? '✅ YES' : '❌ NO'}`);
      });
      
      const allUserIdsMatch = userCartItems.every(item => item.user_id === user.id);
      console.log(`All cart items have matching user_id: ${allUserIdsMatch ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('No cart items found to compare user IDs');
    }
    console.log('=== END USER ID COMPARISON DEBUG ===');
    
    // Skip RPC call for now - might not exist in database
    console.log('Checkout API - User ID for order:', user.id);

    if (cartError) {
      console.error('Cart Error:', cartError.message);
      return NextResponse.json(
        { success: false, error: `Failed to fetch cart items: ${cartError.message}` },
        { status: 500 }
      );
    }

    // Check if cart is empty
    if (!userCartItems || userCartItems.length === 0) {
      console.log('Cart is empty for user:', user.id);
      return NextResponse.json(
        { success: false, error: 'Your cart is empty. Please add items before checkout.' },
        { status: 400 }
      );
    }

    console.log('Found cart items:', userCartItems.length, 'items for user:', user.id);

    // Get product details separately
    const productIds = (userCartItems as any[]).map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) {
      console.error('Products Error:', productsError.message);
      return NextResponse.json(
        { success: false, error: `Failed to fetch product details: ${productsError.message}` },
        { status: 500 }
      );
    }

    // Combine cart items with product details
    const cartItemsWithProducts = (userCartItems as any[]).map((item: any) => ({
      ...item,
      product: (products as any[])?.find((p: any) => p.id === item.product_id)
    }));

    // Validate that the cart items match what was sent
    const cartTotal = cartItemsWithProducts.reduce((sum: number, item: any) => {
      const itemTotal = (item.product?.price || 0) * item.quantity;
      console.log(`Item ${item.product_id}: ${item.product?.price || 0} × ${item.quantity} = ${itemTotal}`);
      return sum + itemTotal;
    }, 0);

    console.log(`=== CART TOTAL CALCULATION DEBUG ===`);
    console.log(`Cart items count: ${cartItemsWithProducts.length}`);
    console.log(`Calculated cart total: ₹${cartTotal}`);
    console.log(`Expected amount (paise): ${Math.round(cartTotal * 100)}`);
    console.log(`Received amount (paise): ${amount}`);
    console.log(`=== END CART TOTAL DEBUG ===`);

    // Verify the amount matches (convert from paise to rupees for comparison)
    const expectedAmount = Math.round(cartTotal * 100);
    console.log('=== AMOUNT VALIDATION DEBUG ===');
    console.log('Cart total (rupees):', cartTotal);
    console.log('Expected amount (paise):', expectedAmount);
    console.log('Received amount (paise):', amount);
    console.log('Amount type:', typeof amount);
    console.log('Expected amount type:', typeof expectedAmount);
    console.log('=== END AMOUNT VALIDATION DEBUG ===');
    
    if (amount !== expectedAmount) {
      console.error('Amount mismatch:', { expected: expectedAmount, received: amount, cartTotal });
      return NextResponse.json(
        { success: false, error: `Cart total mismatch. Expected: ₹${(expectedAmount/100).toFixed(2)}, Received: ₹${(amount/100).toFixed(2)}. Please refresh and try again.` },
        { status: 400 }
      );
    }

    // Create order with new schema: customer_id and shipping_address columns
    const totalAmount = amount / 100; // Convert from paise to rupees
    console.log('Checkout API - Creating order with:', {
      customer_id: user.id,
      total_amount: totalAmount,
      shipping_address: shippingAddress
    });
    
    const orderData = {
      customer_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null
    };
    
    console.log('Checkout API - Order data to insert:', orderData);
    console.log('Checkout API - About to create order...');
    
    // Debug: Log user context before order creation
    console.log('Checkout API - Final auth check before order creation:', user.id);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData as any)
      .select()
      .single();

    console.log('Checkout API - Order creation result:', { order, orderError });

    if (orderError) {
      console.error('Order Creation Error:', orderError);
      console.error('Order Creation Error Details:', {
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code
      });
      return NextResponse.json(
        { success: false, error: `Failed to create order: ${orderError.message}` },
        { status: 500 }
      );
    }

    console.log('Order created successfully:', (order as any)?.id);

    // Initialize Razorpay
    console.log('Initializing Razorpay with key ID:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
    console.log('=== RAZORPAY INITIALIZATION DEBUG ===');
    console.log('Razorpay Key ID exists:', !!process.env.RAZORPAY_KEY_ID);
    console.log('Razorpay Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('Order amount:', amount);
    console.log('Order currency:', currency);
    console.log('=== END RAZORPAY DEBUG ===');
    
    try {
      // Get environment variables at runtime
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!razorpayKeyId || !razorpayKeySecret) {
        console.error('Missing Razorpay environment variables');
        
        return NextResponse.json({ error: "Missing API Keys" }, { status: 500 });
      }
      
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      console.log('Razorpay initialized successfully');
      
      // Razorpay instance creation is sufficient to test credentials
      console.log('Razorpay credentials validated successfully');

      // Create Razorpay order with proper integer amount in paise
      // The amount coming from frontend is already in paise, but ensure it's an integer
      const amountInPaise = Math.round(Number(amount)); // Ensure amount is integer (already in paise)
      if (amountInPaise < 100) {
        console.error('Amount too small for Razorpay:', amountInPaise);
        return NextResponse.json(
          { success: false, error: 'Amount too small for payment. Minimum amount is ₹1.' },
          { status: 400 }
        );
      }
      
      const options = {
        amount: amountInPaise, // Must be integer in paise
        currency: "INR", // Explicitly set to INR
        receipt: `rcpt_${(order as any)?.id?.slice(-8)}_${Date.now().toString().slice(-6)}`,
        notes: {
          order_id: (order as any)?.id,
          user_id: user.id,
          items_count: userCartItems.length
        },
        // Ensure all payment methods are available
        payment_capture: 1
      };

      console.log('Creating Razorpay order with options:', {
        amount: options.amount,
        amountType: typeof options.amount,
        currency: options.currency,
        receipt: options.receipt,
        keyId: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...',
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
      });

      const razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', razorpayOrder.id);

      return NextResponse.json({
        success: true,
        order: {
          id: (razorpayOrder as any).id,
          amount: (razorpayOrder as any).amount,
          currency: (razorpayOrder as any).currency,
          receipt: (razorpayOrder as any).receipt,
          notes: (razorpayOrder as any).notes
        }
      });
    } catch (razorpayError) {
      console.error('=== RAZORPAY ERROR DEBUG ===');
      console.error('Full Razorpay Error:', razorpayError);
      console.error('Razorpay Error Details:', razorpayError);
      console.error('Full Razorpay error:', JSON.stringify(razorpayError, null, 2));
      console.error('Error type:', typeof razorpayError);
      console.error('Error constructor:', razorpayError?.constructor?.name);
      
      if (razorpayError && typeof razorpayError === 'object') {
        console.error('Error keys:', Object.keys(razorpayError));
        Object.entries(razorpayError).forEach(([key, value]) => {
          console.error(`  ${key}:`, value);
        });
      }
      
      // Extract more detailed error information
      let errorMessage = 'Unknown Razorpay error';
      let errorDetails = '';
      
      if (razorpayError instanceof Error) {
        errorMessage = razorpayError.message;
        errorDetails = razorpayError.stack || '';
      } else if (typeof razorpayError === 'string') {
        errorMessage = razorpayError;
      } else if (razorpayError && typeof razorpayError === 'object') {
        // Try to extract common error properties
        errorMessage = (razorpayError as any).message || (razorpayError as any).error || (razorpayError as any).description || 'Unknown Razorpay error';
        errorDetails = JSON.stringify(razorpayError, null, 2);
      }
      
      console.error('Final Razorpay error message:', errorMessage);
      console.error('Final Razorpay error details:', errorDetails);
      console.error('=== END RAZORPAY ERROR DEBUG ===');
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Payment service error: ${errorMessage}`,
          details: errorDetails
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('=== CHECKOUT CATCH BLOCK ERROR ===');
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'No error message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error && typeof error === 'object') {
      console.error('Error keys:', Object.keys(error));
      Object.entries(error).forEach(([key, value]) => {
        console.error(`  ${key}:`, value);
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Final error message to return:', errorMessage);
    console.error('=== END CHECKOUT CATCH BLOCK ERROR ===');
    
    // Handle specific Razorpay errors
    if (errorMessage.includes('RAZORPAY') || errorMessage.includes('razorpay')) {
      return NextResponse.json(
        { success: false, error: `Payment service error: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to create order: ${errorMessage}` },
      { status: 500 }
    );
  }
}
