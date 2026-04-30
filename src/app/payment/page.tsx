'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Shield, Truck, Loader2, Check } from 'lucide-react';
import { safeFetch } from '@/utils/fetch-wrapper';
import { useToast } from '@/contexts/toast-context';

// Razorpay key constant defined outside component
const RZP_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [scriptTimeout, setScriptTimeout] = useState(false);

  // Debug console logs for environment variable
  console.log('=== Razorpay Debug Info ===');
  console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim());
  console.log('RZP_KEY constant:', RZP_KEY);
  console.log('Environment check:', typeof process !== 'undefined' && process.env);

  useEffect(() => {
    // Set timeout for script loading
    const timeoutId = setTimeout(() => {
      if (!scriptLoaded) {
        console.error('Razorpay script loading timeout');
        setScriptTimeout(true);
        setError('Payment gateway failed to load. Please check your internet connection and try again.');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, [scriptLoaded]);

  // Additional safety timeout to prevent indefinite loading
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.error('Page stuck in loading state - forcing exit');
        setError('Page loading took too long. Please refresh and try again.');
        setLoading(false);
      }
    }, 10000); // 10 second safety timeout

    return () => clearTimeout(safetyTimeout);
  }, [loading]);

  useEffect(() => {
    // Get amount and orderId from query params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const orderAmount = urlParams.get('amount') || sessionStorage.getItem('payment_amount');
    const orderId = urlParams.get('orderId') || sessionStorage.getItem('order_id');
    
    // Log parameters for debugging
    console.log('=== Payment Parameters Debug ===');
    console.log('Order ID:', orderId);
    console.log('Amount:', orderAmount);
    console.log('Amount type:', typeof orderAmount);
    console.log('Is amount null:', orderAmount === null);
    console.log('Is amount undefined:', orderAmount === undefined);
    console.log('Is orderId null:', orderId === null);
    console.log('Is orderId undefined:', orderId === undefined);
    console.log('URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Session storage payment_amount:', sessionStorage.getItem('payment_amount'));
    console.log('Session storage order_id:', sessionStorage.getItem('order_id'));
    
    // Check if orderId is missing
    if (!orderId) {
      console.error('No order ID specified');
      setError('No order ID found. Please return to checkout and try again.');
      setLoading(false);
      return;
    }
    
    if (orderAmount) {
      const parsedAmount = parseFloat(orderAmount);
      console.log('Parsed amount:', parsedAmount);
      console.log('Is parsed amount NaN:', isNaN(parsedAmount));
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error('Invalid payment amount:', orderAmount);
        setError('Invalid payment amount. Please return to checkout.');
        setLoading(false);
        return;
      }
      
      setAmount(parsedAmount);
    } else {
      console.error('No payment amount specified');
      setError('No payment amount specified. Please return to checkout.');
    }
    
    // Always set loading to false after processing
    setLoading(false);
  }, []);

  const handleScriptLoad = () => {
    console.log('Razorpay script loaded successfully via Next.js Script');
    setScriptLoaded(true);
    setLoading(false); // Ensure loading is set to false when script loads
  };

  const handleScriptError = () => {
    console.error('Failed to load Razorpay script via Next.js Script');
    setError('Failed to load payment gateway. Please refresh the page.');
    setScriptLoaded(false);
    setLoading(false); // Ensure loading is set to false on script error
  };

  const handlePayment = async () => {
    console.log('=== Payment Initiated ===');
    console.log('Script loaded:', scriptLoaded);
    console.log('Razorpay available:', !!window.Razorpay);
    console.log('RZP_KEY available:', !!RZP_KEY);
    console.log('Amount:', amount);

    // Temporarily disabled for debugging
    console.log('Payment temporarily disabled for debugging');
    setError('Payment functionality temporarily disabled for debugging');
    return;

    try {
      // Ensure Razorpay script is loaded and available
      if (!scriptLoaded || scriptTimeout) {
        const errorMsg = scriptTimeout 
          ? 'Payment gateway failed to load due to timeout. Please refresh the page.'
          : 'Payment gateway is still loading. Please wait...';
        setError(errorMsg);
        return;
      }

      if (!window.Razorpay) {
        console.error('window.Razorpay is undefined even after script loaded');
        const errorMsg = 'Payment gateway not available. Redirecting to checkout...';
        setError(errorMsg);
        
        // Show toast error
        showError('Unable to load payment gateway. Please try again.');
        
        // Redirect to checkout after a short delay
        setTimeout(() => {
          router.push('/checkout');
        }, 2000);
        return;
      }

      if (!RZP_KEY) {
        setError('Payment configuration error. Please contact support.');
        console.error('Razorpay key is missing:', { RZP_KEY, envVar: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() });
        return;
      }

      if (amount <= 0 || isNaN(amount)) {
        setError('Invalid payment amount');
        return;
      }

      if (!shippingAddress || shippingAddress.trim() === '') {
        setError('Shipping address is required');
        return;
      }

      setProcessing(true);
      setError(null);

    try {
      // Amount integer fix - ensure no decimals are sent
      const amountInPaise = Math.floor(parseFloat(amount.toString()) * 100);
      console.log('Amount in paise:', amountInPaise);

      // Create order on backend
      console.log('Creating order...');
      console.log('API Request Body:', {
        amount: amountInPaise,
        currency: 'INR',
        shippingAddress: shippingAddress
      });
      
      let orderResponse;
      try {
        orderResponse = await safeFetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            shippingAddress: shippingAddress
          }),
        });
      } catch (fetchError) {
        console.error('Network error creating order:', fetchError);
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!orderResponse || !orderResponse.ok) {
        const errorText = orderResponse ? await orderResponse.text() : 'No response';
        console.error('Order creation failed:', errorText);
        throw new Error('Failed to create payment order. Please try again.');
      }

      let orderData;
      try {
        orderData = await orderResponse.json();
      } catch (parseError) {
        console.error('Failed to parse order response:', parseError);
        throw new Error('Invalid response from payment server. Please try again.');
      }
      console.log('Order created:', orderData);

      // Check if the API returned success and extract order data
      if (!orderData.success || !orderData.order) {
        console.error('API returned error:', orderData);
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const razorpayOrder = orderData.order;
      console.log('Razorpay Order Response:', razorpayOrder);

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim(),
        amount: amountInPaise,
        currency: 'INR',
        name: 'Num1Store',
        description: 'Purchase Payment',
        order_id: razorpayOrder.id,
        receipt: razorpayOrder.receipt,
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          
          try {
            // Verify payment on backend
            const verifyResponse = await safeFetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress: shippingAddress,
              }),
            });

            if (verifyResponse.ok) {
              // Payment successful, redirect to success page
              router.push('/order-success?payment_id=' + response.razorpay_payment_id);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || user?.email || 'Customer',
          email: user?.email || '',
          contact: user?.user_metadata?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setProcessing(false);
          }
        }
      };

      console.log('Opening Razorpay modal with options:', options);
      
      // Wrap Razorpay initialization in try-catch
      try {
        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response);
          setError(`Payment failed: ${response.error.description}`);
          setProcessing(false);
        });

        rzp.open();
        console.log('Razorpay modal opened successfully');
      } catch (razorpayError) {
        console.error('Razorpay initialization failed:', razorpayError);
        setError('Failed to initialize payment gateway. Please try again.');
        setProcessing(false);
        
        // Show toast error
        showError('Payment gateway initialization failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setError('Payment processing failed. Please try again.');
      setProcessing(false);
    }
    } catch (outerError) {
      console.error('Outer payment handling error:', outerError);
      setError('An unexpected error occurred. Please try again.');
      setProcessing(false);
    }
  };

  const handleBack = () => {
    router.push('/cart');
  };

  if (loading) {
    console.log('=== LOADING STATE DEBUG ===');
    console.log('Loading state:', loading);
    console.log('Script loaded:', scriptLoaded);
    console.log('Script timeout:', scriptTimeout);
    console.log('Error state:', error);
    console.log('Amount set:', amount > 0);
    console.log('=== END LOADING DEBUG ===');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment gateway...</p>
          {scriptTimeout && (
            <p className="text-red-500 mt-2 text-sm">Taking longer than expected...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </button>
          
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600">
              Secure payment processing via Razorpay
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Payment Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">₹{amount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium text-gray-900">₹0.00</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address *
              </label>
              <textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your complete delivery address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Please provide your complete address including landmark
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>Your payment information is encrypted and secure. We use Razorpay's secure payment gateway for all transactions.</p>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Button
            onClick={handlePayment}
            disabled={processing || !scriptLoaded}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₹{amount.toFixed(2)} with Razorpay
              </div>
            )}
          </Button>
          
          <p className="mt-4 text-center text-sm text-gray-500">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="space-y-1">
              <p>Script Loaded: {scriptLoaded ? 'Yes' : 'No'}</p>
              <p>Razorpay Available: {window.Razorpay ? 'Yes' : 'No'}</p>
              <p>RZP Key: {RZP_KEY ? 'Set' : 'Not Set'}</p>
              <p>Key Value: {RZP_KEY ? RZP_KEY.substring(0, 10) + '...' : 'N/A'}</p>
              <p>Amount: ₹{amount}</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
