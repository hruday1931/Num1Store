'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { XCircle, CreditCard, RefreshCw, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';

function OrderFailedContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorReason, setErrorReason] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    // Get query parameters
    const reasonParam = searchParams.get('reason');
    const paymentMethodParam = searchParams.get('paymentMethod');

    if (reasonParam) {
      setErrorReason(reasonParam);
    }
    if (paymentMethodParam) {
      setPaymentMethod(paymentMethodParam as 'online' | 'cod');
    }
  }, [user, loading, router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const getErrorSuggestion = (reason: string) => {
    switch (reason) {
      case 'payment_failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please check your payment details and try again.',
          suggestions: [
            'Check if your card has sufficient funds',
            'Verify your card details are correct',
            'Try using a different payment method',
            'Contact your bank if the issue persists'
          ]
        };
      case 'payment_cancelled':
        return {
          title: 'Payment Cancelled',
          message: 'You cancelled the payment process. You can try again whenever you\'re ready.',
          suggestions: [
            'Try the payment again when ready',
            'Consider using a different payment method',
            'Save your cart items for later'
          ]
        };
      case 'network_error':
        return {
          title: 'Network Error',
          message: 'A network error occurred during payment. Please check your connection and try again.',
          suggestions: [
            'Check your internet connection',
            'Refresh the page and try again',
            'Try using a different network',
            'Contact support if the issue persists'
          ]
        };
      default:
        return {
          title: 'Order Failed',
          message: 'Something went wrong while processing your order. Please try again.',
          suggestions: [
            'Refresh the page and try again',
            'Check your cart items',
            'Try a different payment method',
            'Contact customer support if the issue continues'
          ]
        };
    }
  };

  const errorInfo = getErrorSuggestion(errorReason);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Error Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {errorInfo.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {errorInfo.message}
            </p>
          </div>

          {/* Error Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-6">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">What You Can Do</h2>
            </div>
            
            <div className="space-y-4">
              {errorInfo.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm font-medium">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Suggestions */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-6">
              <CreditCard className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Try Another Payment Method</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Online Payment</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Pay securely using credit/debit cards, UPI, or net banking
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Instant confirmation</li>
                  <li>• Multiple payment options</li>
                  <li>• Secure transactions</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center mb-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Pay when you receive your order at your doorstep
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Pay after delivery</li>
                  <li>• No online payment needed</li>
                  <li>• Available nationwide</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Need Help?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">?</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">FAQs</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Find answers to common payment and order questions
                </p>
                <Button
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  onClick={() => router.push('/help')}
                >
                  View FAQs
                </Button>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">@</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Our support team is here to help you 24/7
                </p>
                <Button
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  onClick={() => router.push('/contact')}
                >
                  Get Help
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/cart')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <OrderFailedContent />
    </Suspense>
  );
}
