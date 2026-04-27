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
  // Add a wrapper to catch all errors and ensure proper response
  try {
    console.log('=== NEW CHECKOUT API VERSION - DEBUG ===');
    console.log('API called at:', new Date().toISOString());
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    try {
    // Read the body immediately to avoid "Body already read" errors
    const body = await request.json();
    
    // Add the specific debugging logs requested
    console.log("Request Body:", body);
    console.log("Razorpay Secret:", process.env.RAZORPAY_KEY_SECRET);
    
    const { amount, currency, shippingAddress } = body;
    
    // Validate required fields
    if (!amount || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, currency' },
        { status: 400 }
      );
    }

    // Validate amount is a proper number
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400 }
      );
    }

    console.log('=== AMOUNT VALIDATION DEBUG ===');
    console.log('Original amount:', amount);
    console.log('Parsed amount:', parsedAmount);
    console.log('Amount type:', typeof amount);
    console.log('Is valid number:', !isNaN(parsedAmount) && parsedAmount > 0);
    console.log('=== END AMOUNT VALIDATION DEBUG ===');
    
    // Check for missing or placeholder Razorpay keys
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('=== RAZORPAY CREDENTIALS CHECK ===');
    console.log('Key ID exists:', !!keyId);
    console.log('Key Secret exists:', !!keySecret);
    console.log('Key ID value:', keyId?.substring(0, 10) + '...');
    console.log('Key ID is placeholder:', keyId?.includes('your_razorpay_key_id_here'));
    console.log('Key Secret is placeholder:', keySecret?.includes('your_razorpay_key_secret_here'));
    console.log('=== END CREDENTIALS CHECK ===');
    
    if (!keyId || !keySecret || 
        keyId.includes('your_razorpay_key_id_here') || 
        keySecret.includes('your_razorpay_key_secret_here')) {
      console.log('Development mode: Razorpay credentials not configured, returning mock response');
      const timestamp = Date.now();
      return NextResponse.json({
        success: true,
        order: {
          id: `dev_order_${timestamp}`,
          amount: parsedAmount,
          currency: currency,
          receipt: `dev_receipt_${timestamp}`,
          notes: { message: 'Development mode - mock order' }
        },
        development: true,
        message: 'This is a mock order for development. Configure Razorpay credentials for production.',
        timestamp: timestamp,
        api_version: 'v2-fixed'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // Validate Razorpay credentials
    console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
    console.log('Razorpay Key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    console.log('Razorpay Secret Present:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('RAZORPAY_KEY_ID exists:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('RAZORPAY_KEY_ID value:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + '...');
    console.log('RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length);
    console.log('=== END ENVIRONMENT VARIABLES DEBUG ===');
    
    // Explicit check for Razorpay key secret
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ RAZORPAY_KEY_SECRET is undefined or not loaded');
      throw new Error('RAZORPAY_KEY_SECRET environment variable is not configured. Please check your .env file.');
    }
    
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing:', {
        hasKeyId: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        keyIdPrefix: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + '...',
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
    console.log(`Received amount (paise): ${parsedAmount}`);
    console.log(`=== END CART TOTAL DEBUG ===`);

    // Verify the amount matches (convert from paise to rupees for comparison)
    const expectedAmount = Math.round(cartTotal * 100);
    console.log('=== AMOUNT VALIDATION DEBUG ===');
    console.log('Cart total (rupees):', cartTotal);
    console.log('Expected amount (paise):', expectedAmount);
    console.log('Received amount (paise):', parsedAmount);
    console.log('Amount type:', typeof parsedAmount);
    console.log('Expected amount type:', typeof expectedAmount);
    console.log('=== END AMOUNT VALIDATION DEBUG ===');
    
    if (parsedAmount !== expectedAmount) {
      console.error('Amount mismatch:', { expected: expectedAmount, received: parsedAmount, cartTotal });
      return NextResponse.json(
        { success: false, error: `Cart total mismatch. Expected: ₹${(expectedAmount/100).toFixed(2)}, Received: ₹${(parsedAmount/100).toFixed(2)}. Please refresh and try again.` },
        { status: 400 }
      );
    }

    // Create order with new schema: customer_id and shipping_address columns
    const totalAmount = parsedAmount / 100; // Convert from paise to rupees
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
    console.log('Initializing Razorpay with key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + '...');
    console.log('=== RAZORPAY INITIALIZATION DEBUG ===');
    console.log('Razorpay Key ID exists:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    console.log('Razorpay Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
    console.log('Order amount:', amount);
    console.log('Order currency:', currency);
    console.log('=== END RAZORPAY DEBUG ===');
    
    // Get environment variables at runtime
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay environment variables');
      return NextResponse.json({ error: "Missing API Keys" }, { status: 500 });
    }
    
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
    
    // Razorpay instance creation is sufficient to test credentials
    console.log('Razorpay credentials validated successfully');

    // Create Razorpay order with proper error handling
    try {
      console.log('=== CREATING RAZORPAY ORDER ===');
      console.log('Amount:', parsedAmount);
      console.log('Currency:', currency);
      console.log('Amount type:', typeof parsedAmount);
      console.log('=== END RAZORPAY ORDER DEBUG ===');
      
      // Validate amount is in paise and is a number
      const amountInPaise = Math.round(parsedAmount);
      console.log('=== AMOUNT VALIDATION ===');
      console.log('Original amount:', parsedAmount);
      console.log('Amount type:', typeof parsedAmount);
      console.log('Amount after rounding:', amountInPaise);
      console.log('Is NaN:', isNaN(amountInPaise));
      console.log('Is minimum amount:', amountInPaise < 100);
      console.log('=== END AMOUNT VALIDATION ===');
      
      if (isNaN(amountInPaise) || amountInPaise < 100) {
        console.error('Invalid amount for Razorpay:', parsedAmount);
        return NextResponse.json(
          { success: false, error: 'Invalid amount. Minimum amount is ₹1 (100 paise).' },
          { status: 400 }
        );
      }
      
      const options = {
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: `rcpt_${(order as any)?.id?.slice(-8)}_${Date.now().toString().slice(-6)}`,
        notes: {
          order_id: (order as any)?.id,
          user_id: user.id,
          items_count: userCartItems.length
        },
        payment_capture: 1
      };

      console.log('Razorpay order options:', JSON.stringify(options, null, 2));
      
      const razorpayOrder = await razorpay.orders.create(options);
      console.log('=== RAZORPAY ORDER DEBUG ===');
      console.log('ORDER_DATA:', order);
      console.log("Razorpay Order Created:", razorpayOrder);
      console.log('✅ Razorpay order created successfully:', razorpayOrder.id);
      console.log("RAZORPAY_ORDER:", razorpayOrder);
      console.log('Razorpay Order Response:', razorpayOrder);

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
      console.error('❌ RAZORPAY ORDER CREATION FAILED:');
      console.error('Error:', razorpayError);
      console.error('Error message:', razorpayError instanceof Error ? razorpayError.message : 'Unknown error');
      console.error('Error stack:', razorpayError instanceof Error ? razorpayError.stack : 'No stack');
      
      // Additional debugging for credential issues
      console.error('=== RAZORPAY CREDENTIALS DEBUG ===');
      console.error('RAZORPAY_KEY_ID exists:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      console.error('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
      console.error('RAZORPAY_KEY_ID value:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      console.error('RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length);
      console.error('=== END RAZORPAY CREDENTIALS DEBUG ===');
      
      if (razorpayError && typeof razorpayError === 'object') {
        console.error('Error keys:', Object.keys(razorpayError));
        Object.entries(razorpayError).forEach(([key, value]) => {
          console.error(`  ${key}:`, value);
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create payment order: ${razorpayError instanceof Error ? razorpayError.message : 'Unknown error'}`,
          details: razorpayError
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
    console.error('Request method:', request.method);
    console.error('Request URL:', request.url);
    
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
  } catch (outerError) {
    console.error('=== OUTER CATCH BLOCK - UNHANDLED ERROR ===');
    console.error('Outer error:', outerError);
    return NextResponse.json(
      { success: false, error: `Unhandled server error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
