'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart, CartItem } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { useAddresses } from '@/hooks/use-addresses';
import { AddressForm } from '@/components/forms/address-form';
import { AddressData } from '@/types';
import { ShoppingCart, ArrowRight, MapPin, CreditCard, Truck } from 'lucide-react';
import { safeFetch } from '@/utils/fetch-wrapper';
import { supabaseClient } from '@/utils/supabase/client';

export default function CartPage() {
  const { user, session, loading } = useAuth();
  const supabase = supabaseClient();
  const { cartItems, loading: cartLoading, updateQuantity, removeFromCart, removeItem, cartTotal, clearCart, fetchCartItems } = useCart();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'online' | 'cod'>('online');
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  const { success, error: showError } = useToast();
  const { addresses, loading: addressesLoading, saveAddress } = useAddresses();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  // Auto-select default address when only one address exists
  useEffect(() => {
    if (addresses.length === 1 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress]);

  // Load Razorpay SDK
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (typeof (window as any).Razorpay !== 'undefined') {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        setRazorpayLoading(false);
      };
      script.onerror = () => {
        setRazorpayLoading(false);
        showError('Failed to load payment service. Please refresh the page.');
      };
      document.head.appendChild(script);
    };

    loadRazorpayScript();
  }, [showError]);

  const handleSaveAddress = async (addressData: any) => {
    setIsSavingAddress(true);
    try {
      const newAddress = await saveAddress(addressData);
      setSelectedAddress(newAddress);
      setShowAddressForm(false);
      success('Shipping address saved successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      showError('Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePaymentMethodChange = (method: 'online' | 'cod') => {
    try {
      setPaymentMethodError(null);
      setSelectedPaymentMethod(method);
      console.log('Payment method changed to:', method);
    } catch (error) {
      console.error('Error changing payment method:', error);
      setPaymentMethodError('Failed to change payment method. Please try again.');
    }
  };

  const handleCodOrder = async () => {
    if (!selectedAddress) {
      showError('Please select a shipping address before proceeding to checkout.');
      return;
    }

    if (!user || !session) {
      showError('Please sign in to proceed with checkout.');
      router.push('/auth/signin');
      return;
    }

    setIsCheckingOut(true);
    try {
      // Force refresh cart data before checkout
      await fetchCartItems();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get fresh session token
      let { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (!freshSession && !sessionError) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session) {
          freshSession = refreshData.session;
        }
      }
      
      if (sessionError || !freshSession || !freshSession.user) {
        showError('Session expired. Please sign in again.');
        router.push('/auth/signin');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshSession.access_token}`,
      };

      // Create COD order directly
      console.log('=== COD ORDER DEBUG INFO ===');
      console.log('User ID:', freshSession.user.id);
      console.log('Cart Items:', cartItems);
      console.log('Cart Total:', cartTotal);
      console.log('Total Amount Type:', typeof cartTotal);
      
      const orderData = {
        cartItems: cartItems.map((item: CartItem) => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity.toString()),
          price: Number(item.products?.price?.toString() || '0')
        })),
        shippingAddress: JSON.stringify(selectedAddress), // Ensure shipping_address is sent as a simple string
        userId: freshSession.user.id,
        totalAmount: Number(cartTotal) // Ensure p_total_amount is a number
      };
      
      console.log('Order Data:', { ...orderData }); // Debug log for order data
      console.log('COD Order - Request body:', JSON.stringify(orderData, null, 2));
      console.log('COD Order - Request headers:', headers);
      console.log('COD Order - API URL:', '/api/create-cod-order');
      
      const response = await fetch('/api/create-cod-order', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      // Safe check: verify response is ok and result is a valid object with success property
      if (response.ok && result && typeof result === 'object' && result.success && result.orderId) {
        await clearCart();
        success('Order placed successfully!');
        // Redirect to orders page instead of sign-in page
        router.push('/orders');
      } else {
        console.error('=== COD ORDER ERROR DETAILS ===');
        console.error('Response status:', response.status);
        console.error('Response ok:', response.ok);
        console.error('Full response:', JSON.stringify(result, null, 2));
        console.error('Response type:', typeof result);
        
        // Handle different types of error responses
        let errorMsg = 'Failed to create order';
        
        if (result && typeof result === 'object') {
          console.error('Error message:', result.error);
          console.error('Error code:', result.code);
          console.error('Status:', result.status);
          
          errorMsg = result.error?.includes('500') 
            ? 'Server error occurred while creating your order. Please try again or contact support.'
            : result.error || 'Failed to create order';
        } else if (typeof result === 'string') {
          errorMsg = `Server error: ${result}`;
        } else {
          errorMsg = 'Invalid server response. Please try again or contact support.';
        }
        
        showError(errorMsg);
      }
    } catch (error) {
      console.error('=== COD CHECKOUT CATCH BLOCK ERROR ===');
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'COD checkout failed';
      // Show more descriptive error message for catch block
      const descriptiveError = errorMessage.includes('500') || errorMessage.includes('fetch')
        ? 'Network error occurred. Please check your connection and try again.'
        : errorMessage;
      showError(descriptiveError);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      showError('Please select a shipping address before proceeding to checkout.');
      showError('Please select a shipping address');
      return;
    }
    
    // Debug authentication state
    console.log('Checkout Debug - Auth State:', {
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id,
      sessionId: session?.user?.id,
      sessionExpiresAt: session?.expires_at,
      currentTime: Math.floor(Date.now() / 1000)
    });
    
    if (!user || !session) {
      showError('Please sign in to proceed with checkout.');
      router.push('/auth/signin');
      return;
    }

    // Debug: Check if Razorpay key is available
    if (process.env.NODE_ENV === 'development') {
      console.log('Razorpay Key Debug:', {
        keyValue: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'DEFINED' : 'UNDEFINED',
        nodeEnv: process.env.NODE_ENV
      });
    }

    setIsCheckingOut(true);
    console.log('=== CHECKOUT STARTED ===');
    console.log('Cart items count:', cartItems.length);
    console.log('Cart total:', cartTotal);
    console.log('Selected address:', selectedAddress);
    console.log('User authenticated:', !!user);
    console.log('=== END CHECKOUT START ===');
    
    try {
      // Force refresh cart data before checkout
      console.log('=== FORCE REFRESH CART DATA BEFORE CHECKOUT ===');
      await fetchCartItems();
      
      // Wait a moment for the cart to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Cart after force refresh:', {
        itemCount: cartItems.length,
        total: cartTotal,
        items: cartItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.products?.price
        }))
      });
      console.log('=== END FORCE REFRESH CART DATA ===');

      // Get fresh session token to ensure we have the latest
      let { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      // If session is null, try to refresh it
      if (!freshSession && !sessionError) {
        console.log('Checkout: No session found, attempting to refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshData.session) {
          freshSession = refreshData.session;
          console.log('Checkout: Session refresh successful');
        } else {
          console.log('Checkout: Session refresh failed:', refreshError?.message);
        }
      }
      
      console.log('Checkout: Fresh session check:', {
        hasSession: !!freshSession,
        hasUser: !!freshSession?.user,
        userId: freshSession?.user?.id,
        sessionError: sessionError?.message
      });
      
      if (sessionError || !freshSession || !freshSession.user) {
        showError('Session expired. Please sign in again.');
        router.push('/auth/signin');
        return;
      }
      
      // Set up headers with Bearer token
      if (!freshSession.access_token) {
        throw new Error('No access token available. Please sign in again.');
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshSession.access_token}`,
      };

      console.log('Checkout: Using Bearer token authentication');
      console.log('Checkout: Session user ID:', freshSession.user.id);
      console.log('Checkout: Access token (first 20 chars):', freshSession.access_token?.substring(0, 20) + '...');
      console.log('Checkout: Access token length:', freshSession.access_token?.length);
      console.log('Checkout: Session expires at:', freshSession.expires_at ? new Date(freshSession.expires_at * 1000).toISOString() : 'Not set');
      console.log('Checkout: Current time:', new Date().toISOString());
      
      const data = await safeFetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Math.round(cartTotal * 100), // Convert to paise
          currency: 'INR',
          cartItems: cartItems.map((item: CartItem) => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: item.products?.price
          })),
          shippingAddress: selectedAddress, // Ensure shipping address is included
          userId: freshSession.user.id // Include user ID for verification
        }),
      });
      
      console.log('=== CHECKOUT API RESPONSE ===');
      console.log('Response data:', data);
      console.log('Response type:', typeof data);
      console.log('Success:', data?.success);
      console.log('Order data:', data?.order);
      console.log('=== END CHECKOUT API RESPONSE ===');
      
      // Check if data is a valid object before accessing properties
      if (data && typeof data === 'object' && data.success) {
        // Check if this is development mode
        if (data.development) {
          console.log('🚀 DEVELOPMENT MODE: Using mock order');
          console.log('Mock order ID:', data.order?.id);
          console.log('Message:', data.message);
        }
        
        // Validate required Razorpay options
        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
          console.error('❌ Missing Razorpay key ID');
          showError('Payment service configuration error. Missing Razorpay key.');
          return;
        }
        
        if (!data.order?.amount || !data.order?.currency || !data.order?.id) {
          console.error('❌ Missing order data:', data.order);
          showError('Invalid order data received. Please try again.');
          return;
        }

        // Debug: Log the order data received from API
        console.log('=== FRONTEND RAZORPAY DEBUG ===');
        console.log('Order data from API:', data.order);
        console.log('Razorpay Key ID exists:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
        console.log('Razorpay Key ID value:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + '...');
        console.log('Order ID:', data.order.id);
        console.log('Amount:', data.order.amount);
        console.log('Currency:', data.order.currency);
        console.log('=== END FRONTEND RAZORPAY DEBUG ===');

        // Initialize Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'Num1Store',
          description: 'Purchase from Num1Store',
          order_id: data.order.id,
          handler: async function (response: any) {
            console.log('=== RAZORPAY PAYMENT SUCCESS ===');
            console.log('Payment response:', response);
            console.log('=== END RAZORPAY PAYMENT SUCCESS ===');
            // Verify payment
            const verifyHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${freshSession.access_token}`,
            };
            
            const verifyData = await safeFetch('/api/verify-payment', {
              method: 'POST',
              headers: verifyHeaders,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress: selectedAddress,
              }),
            });
            
            // Check if verifyData is a valid object before accessing properties
            if (verifyData && typeof verifyData === 'object' && verifyData.success) {
              // Clear cart after successful payment
              await clearCart();
              success('Order placed successfully!');
              router.push('/order-success');
            } else {
              console.error('Payment verification failed:', verifyData?.error);
              showError(verifyData?.error || 'Payment verification failed');
            }
          },
          prefill: {
            name: user.email?.split('@')[0] || '',
            email: user.email || '',
          },
        };

        // Verify Razorpay SDK is loaded with retry mechanism
        if (typeof (window as any).Razorpay === 'undefined') {
          if (!razorpayLoaded && !razorpayLoading) {
            setRazorpayLoading(true);
            // Try to load the script again
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
              setRazorpayLoaded(true);
              setRazorpayLoading(false);
              // Retry opening Razorpay after script loads
              setTimeout(() => {
                try {
                  const razorpay = new (window as any).Razorpay(options);
                  razorpay.on('payment.failed', function (response: any) {
                    console.error('Payment failed:', response.error);
                    showError(`Payment failed: ${response.error.description || 'Unknown error'}`);
                  });
                  razorpay.open();
                } catch (error) {
                  console.error('Error opening Razorpay:', error);
                  showError('Failed to open payment modal. Please try again.');
                }
              }, 500);
            };
            script.onerror = () => {
              setRazorpayLoading(false);
              showError('Failed to load payment service. Please refresh the page.');
            };
            document.head.appendChild(script);
          } else {
            showError('Payment service is loading. Please try again in a moment.');
          }
          return;
        }

        try {
          console.log('🚀 Initializing Razorpay with options:', {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + '...',
            amount: options.amount,
            currency: options.currency,
            order_id: options.order_id
          });
          
          const razorpay = new (window as any).Razorpay(options);
          
          // Add comprehensive error handling for payment failures
          razorpay.on('payment.failed', function (response: any) {
            console.error('❌ PAYMENT FAILED:');
            console.error('Error code:', response.error.code);
            console.error('Error description:', response.error.description);
            console.error('Error source:', response.error.source);
            console.error('Error step:', response.error.step);
            console.error('Error reason:', response.error.reason);
            console.error('Full error response:', response);
            
            const errorMessage = response.error?.description || 'Payment failed. Please try again.';
            showError(`Payment failed: ${errorMessage}`);
          });
          
          console.log('✅ Opening Razorpay modal...');
          razorpay.open();
        } catch (error) {
          console.error('❌ ERROR OPENING RAZORPAY MODAL:');
          console.error('Error:', error);
          console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
          
          showError('Failed to open payment modal. Please try again.');
        }
      } else {
        console.error('❌ CHECKOUT API ERROR:');
        console.error('Response data:', data);
        console.error('Response type:', typeof data);
        console.error('Success property:', data?.success);
        console.error('Error property:', data?.error);
        
        const errorMsg = data && typeof data === 'object' 
          ? (data.error || 'Failed to create order')
          : 'Invalid server response. Please try again.';
        
        console.error('Final error message to show:', errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      
      // If it's an authentication error, run debug checks
      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        console.log('Running authentication debug due to auth error...');
        import('@/utils/debug-auth').then(({ debugClientAuth, checkServerAuth }) => {
          debugClientAuth();
          checkServerAuth();
        });
      }
      
      showError(errorMessage);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = cartTotal;
  const shipping = subtotal > 0 ? (subtotal > 100 ? 0 : 10) : 0;
  const total = subtotal + shipping;

  console.log('Cart Page Debug - Current State:', {
    hasUser: !!user,
    userId: user?.id,
    cartItemsCount: cartItems.length,
    cartLoading,
    cartItems: cartItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      hasProduct: !!item.products,
      productName: item.products?.name
    }))
  });

  if (loading || cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="mt-2 text-gray-600">
                Sign in to view and manage your cart
              </p>
            </div>
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to view your cart</h2>
              <p className="text-gray-600 mb-6">Add items to your cart and they'll be waiting for you here</p>
              <div className="space-x-4">
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="mt-2 text-gray-600">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start adding items to your cart</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link href={`/products/${item.product_id}`} className="block flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                          {item.products?.images && item.products.images.length > 0 ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1">
                        <Link href={`/products/${item.product_id}`} className="block">
                          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 transition-colors cursor-pointer">{item.products?.name || 'Product Name Not Available'}</h3>
                        </Link>
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{item.products?.description || 'Product description not available'}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                              className="w-8 h-8 border rounded hover:bg-gray-100 flex items-center justify-center"
                            > - </button>
                            <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 border rounded hover:bg-gray-100 flex items-center justify-center"
                            > + </button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-800 font-medium">₹{(item.products?.price || 0).toFixed(2)} each</p>
                              <p className="font-semibold text-gray-900">
                                ₹{((item.products?.price || 0) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              onClick={() => removeFromCart(item.id)}
                              size="sm"
                              variant="ghost"
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Cart Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-900 font-medium">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-medium">
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-sm text-green-600">
                        Add ₹{(100 - subtotal).toFixed(2)} more for free shipping!
                      </p>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg text-gray-900">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Shipping Address
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddressForm(!showAddressForm)}
                        className="text-green-600 hover:text-green-700"
                      >
                        {showAddressForm ? 'Cancel' : selectedAddress ? 'Edit' : 'Add'}
                      </Button>
                    </div>
                    
                    {showAddressForm ? (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <AddressForm
                          onSave={handleSaveAddress}
                          onCancel={() => setShowAddressForm(false)}
                          loading={isSavingAddress}
                        />
                      </div>
                    ) : addresses.length > 1 ? (
                      <div className="space-y-2">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            onClick={() => setSelectedAddress(address)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedAddress?.id === address.id
                                ? 'bg-green-50 border-green-300'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{address.full_name}</p>
                                <p className="text-sm text-gray-700 mt-1">
                                  {address.street_address}, {address.city}, {address.state} - {address.pin_code}
                                </p>
                                <p className="text-sm text-gray-700 mt-1">Phone: {address.phone_number}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {address.is_default && (
                                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Default
                                  </span>
                                )}
                                {selectedAddress?.id === address.id && (
                                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedAddress ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{selectedAddress.full_name}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {selectedAddress.street_address}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pin_code}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">Phone: {selectedAddress.phone_number}</p>
                        {selectedAddress.is_default && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Default Address
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">Please add a shipping address to proceed</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
                    
                    {/* Payment Method Error */}
                    {paymentMethodError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-red-800">{paymentMethodError}</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === 'online'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handlePaymentMethodChange('online')}
                      >
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-3 text-gray-700" />
                          <div>
                            <p className="font-medium text-gray-900">Online Payment</p>
                            <p className="text-sm text-gray-600">Pay securely with credit/debit card, UPI, etc.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === 'cod'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handlePaymentMethodChange('cod')}
                      >
                        <div className="flex items-center">
                          <Truck className="w-5 h-5 mr-3 text-gray-700" />
                          <div>
                            <p className="font-medium text-gray-900">Cash on Delivery</p>
                            <p className="text-sm text-gray-600">Pay when you receive your order</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={selectedPaymentMethod === 'cod' ? handleCodOrder : handleCheckout}
                    disabled={!selectedAddress || isCheckingOut || cartItems.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        {selectedPaymentMethod === 'cod' ? 'Place Order' : 'Proceed to Payment'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
