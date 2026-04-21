'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, ArrowRight, Package, Truck, CreditCard } from 'lucide-react';

export default function OrderSuccessPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [orderId, setOrderId] = useState<string>('');
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    // Get query parameters
    const paymentMethodParam = searchParams.get('paymentMethod');
    const orderIdParam = searchParams.get('orderId');

    if (paymentMethodParam) {
      setPaymentMethod(paymentMethodParam as 'online' | 'cod');
    }
    if (orderIdParam) {
      setOrderId(orderIdParam);
      fetchOrderDetails(orderIdParam);
    }
  }, [user, loading, router, searchParams]);

  const fetchOrderDetails = async (orderId: string) => {
    if (!user || !session) return;
    
    setLoadingOrder(true);
    try {
      const token = session.access_token;
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrderDetails(orderData);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingOrder(false);
    }
  };

  if (loading) {
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
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-green-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Thank you for your purchase. Your order has been confirmed and will be processed shortly.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-6">
              <Package className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="font-semibold text-gray-900">
                  #{orderDetails?.id ? `ORD-${orderDetails.id.slice(-8).toUpperCase()}` : (orderId ? `ORD-${orderId.slice(-8).toUpperCase()}` : `ORD-${Date.now().toString().slice(-6)}`)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {orderDetails?.created_at ? new Date(orderDetails.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                <div className="flex items-center">
                  {paymentMethod === 'cod' ? (
                    <>
                      <Truck className="w-4 h-4 text-blue-600 mr-2" />
                      <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-green-600 mr-2" />
                      <p className="font-semibold text-gray-900">Online Payment</p>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  orderDetails?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  orderDetails?.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  orderDetails?.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  paymentMethod === 'cod' ? 'bg-orange-100 text-orange-800' 
                  : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {orderDetails?.status ? orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1) : 
                   (paymentMethod === 'cod' ? 'Pending Payment' : 'Processing')}
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{orderDetails?.total_amount ? orderDetails.total_amount.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-6">
              <Truck className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
            </div>
            
            {paymentMethod === 'cod' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Cash on Delivery Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please keep the exact amount ready: <span className="font-semibold">₹{orderDetails?.total_amount ? orderDetails.total_amount.toFixed(2) : '0.00'}</span></li>
                  <li>• Our delivery partner will collect payment upon delivery</li>
                  <li>• Please check your order items before making payment</li>
                  <li>• Delivery will be made to your registered address</li>
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  Your order will be delivered to your registered address. You will receive tracking information once your order is shipped.
                </p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Confirmation</h3>
                <p className="text-sm text-gray-600">You'll receive an email confirmation shortly.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Processing</h3>
                <p className="text-sm text-gray-600">We'll prepare your items for shipping.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
                <p className="text-sm text-gray-600">Your order will be delivered to your address.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3"
            >
              View Orders
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
