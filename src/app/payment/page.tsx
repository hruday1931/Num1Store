'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Loader, Loader2, Check } from 'lucide-react';
import { safeFetch } from '@/utils/fetch-wrapper';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { success, error: showError, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!orderId || !amount) {
      showError('Invalid payment parameters');
      router.push('/checkout');
      return;
    }

    loadRazorpayScript();
  }, [orderId, amount, router]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      setLoading(false);
      setOrderData({
        orderId,
        amount: parseFloat(amount || '0')
      });
    };
    script.onerror = () => {
      showError('Failed to load payment gateway');
      router.push('/checkout');
    };
    document.body.appendChild(script);
  };

  const handlePayment = () => {
    if (!window.Razorpay || !orderData) {
      showError('Payment gateway not loaded');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(orderData.amount * 100), // Convert to paise and ensure integer
      currency: 'INR',
      name: 'Num1Store',
      description: 'Purchase from Num1Store',
      order_id: orderData.orderId,
      handler: function (response: any) {
        // Payment successful
        handlePaymentSuccess(response);
      },
      prefill: {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest Customer',
        email: user?.email || 'guest@example.com',
        contact: user?.phone || ''
      },
      theme: {
        color: '#059669' // Green color matching your theme
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          warning('Payment cancelled');
        },
        escape: false,
        handleback: false
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Payment Methods',
              instruments: [
                {
                  method: 'upi',
                  flows: ['collect', 'qr'],
                  apps: ['google_pay', 'phonepe', 'paytm']
                },
                {
                  method: 'card'
                },
                {
                  method: 'netbanking'
                },
                {
                  method: 'wallet'
                }
              ]
            }
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: false
          }
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    
    // Add error logging for Razorpay modal failures
    razorpay.on('payment.failed', function (response: any) {
      console.error('=== RAZORPAY PAYMENT FAILED ===');
      console.error('Error Code:', response.error.code);
      console.error('Error Description:', response.error.description);
      console.error('Error Source:', response.error.source);
      console.error('Error Step:', response.error.step);
      console.error('Error Reason:', response.error.reason);
      console.error('Error Metadata:', response.error.metadata);
      console.error('=== END RAZORPAY PAYMENT FAILED ===');
      
      setProcessing(false);
      
      // Show user-friendly error message
      let errorMessage = 'Payment failed. Please try again.';
      if (response.error.description) {
        errorMessage = response.error.description;
      }
      
      // Handle specific QR scanning errors
      if (response.error.code === 'BAD_REQUEST_ERROR' && response.error.description?.includes('QR')) {
        errorMessage = 'Unable to scan QR. Please try using UPI collect or another payment method.';
      }
      
      showError(errorMessage);
    });
    
    try {
      razorpay.open();
      setProcessing(true);
    } catch (error) {
      console.error('=== RAZORPAY MODAL OPEN ERROR ===');
      console.error('Error opening Razorpay modal:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('=== END RAZORPAY MODAL OPEN ERROR ===');
      
      setProcessing(false);
      showError('Failed to open payment gateway. Please try again.');
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      // Get shipping address from sessionStorage
      const shippingAddress = sessionStorage.getItem('shippingAddress');
      
      if (!shippingAddress) {
        showError('Shipping address not found. Please try again.');
        router.push('/checkout');
        return;
      }

      // Verify payment and create order
      const verifyData = await safeFetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          shippingAddress: shippingAddress,
        }),
      });
      
      if (verifyData.success) {
        success('Order placed successfully! Redirecting...');
        // Clear shipping address from sessionStorage
        sessionStorage.removeItem('shippingAddress');
        
        // Redirect to order success page
        setTimeout(() => {
          router.push('/order-success?orderId=' + verifyData.orderId);
        }, 2000);
      } else {
        console.error('Payment verification failed:', verifyData.error);
        showError(verifyData.error || 'Payment verification failed');
        router.push('/checkout');
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      showError(errorMessage);
      router.push('/checkout');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Loading Payment Gateway...</h2>
              <p className="text-gray-600 mt-2">Please wait while we prepare your payment</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
            <Link href="/checkout">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Checkout
              </Button>
            </Link>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono text-sm">{orderData?.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(orderData?.amount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Razorpay Secure Payment</p>
                    <p className="text-sm text-gray-600">Pay using UPI, Credit Card, Debit Card, Net Banking & more</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Pay with Razorpay?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">100% Secure</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Instant Payment</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Multiple Options</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Important Notice</p>
                  <p className="text-sm text-blue-800">
                    Please do not refresh or close this page during the payment process. 
                    Your payment will be processed securely through Razorpay's encrypted gateway.
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
            >
              {processing ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing Payment...
                </div>
              ) : (
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {formatPrice(orderData?.amount || 0)}
                </div>
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-4">
              By clicking "Pay", you agree to our Terms of Service and Privacy Policy. 
              All transactions are secured with 256-bit SSL encryption.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-red-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Loading Payment Gateway...</h2>
              <p className="text-gray-600 mt-2">Please wait while we prepare your payment</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
