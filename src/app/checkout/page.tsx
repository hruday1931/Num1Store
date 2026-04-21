'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart, CartItem } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { useAddresses } from '@/hooks/use-addresses';
import { AddressForm } from '@/components/forms/address-form';
import { AddressData } from '@/types';
import { Minus, Plus, ShoppingCart, ArrowRight, MapPin, CreditCard, Truck, Shield, Package, ArrowLeft, Trash2 } from 'lucide-react';
import { safeFetch } from '@/utils/fetch-wrapper';
import Image from 'next/image';

interface CheckoutAddressData {
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  phone_number: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const { user, session, loading: authLoading } = useAuth();
  const { success, error: showError, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  
  const { addresses, loading: addressesLoading, saveAddress } = useAddresses();
  
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId) || addresses.find(addr => addr.is_default) || null;
  
  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(addr => addr.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  // Check authentication and redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/checkout');
        return;
      }
      setLoading(false);
    }
  }, [authLoading, user, router]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateQuantity(itemId, newQuantity);
      // Cart items will update automatically through context
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      // Cart items will update automatically through context
      success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      showError('Failed to remove item');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.products?.price || 0) * item.quantity;
    }, 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 500 ? 0 : 50; // Free shipping above ₹500
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      warning('Your cart is empty');
      return;
    }

    if (!selectedAddress) {
      setShowAddressForm(true);
      showError('Please enter your shipping address');
      return;
    }

    try {
      setProcessing(true);
      
      const data = await safeFetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          amount: calculateTotal() * 100, // Convert to paise for Razorpay
          currency: 'INR'
        }),
      });

      if (data.success) {
        // Store shipping address in sessionStorage for payment verification
        sessionStorage.setItem('shippingAddress', JSON.stringify(selectedAddress));
        // Redirect to payment page with order details
        router.push(`/payment?orderId=${data.order.id}&amount=${calculateTotal()}`);
      } else {
        console.error('Checkout API Error:', data.error);
        showError(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process checkout';
      showError(errorMessage);
    } finally {
      setProcessing(false);
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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow h-96"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-red-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mb-8">
              <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-8">Looks like you haven't added any products to your cart yet.</p>
            </div>
            <Link href="/products">
              <Button className="bg-green-600 hover:bg-green-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <Link href="/cart">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.products?.images?.[0] || '/images/placeholder-product.svg'}
                      alt={item.products?.name || 'Product'}
                      width={96}
                      height={96}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.products?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {formatPrice(item.products?.price || 0)} × {item.quantity}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-white border-2 border-gray-400 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 transition-colors text-black disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-1 font-medium text-black">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 transition-colors text-black"
                          disabled={false}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice((item.products?.price || 0) * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-900 font-medium">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                
                <div className="flex justify-between text-gray-900 font-medium">
                  <span>Shipping</span>
                  <span>
                    {calculateShipping() === 0 ? 'Free' : formatPrice(calculateShipping())}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(calculateTotal())}</span>
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
                    {showAddressForm ? 'Cancel' : addresses.length > 0 ? 'Manage' : 'Add'}
                  </Button>
                </div>
                
                {showAddressForm ? (
                  <AddressForm
                    onSave={async (addressData) => {
                      setSavingAddress(true);
                      try {
                        // Add missing timestamp fields for AddressData compatibility
                        const addressDataWithTimestamps = {
                          ...addressData,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        };
                        const newAddress = await saveAddress(addressDataWithTimestamps);
                        setSelectedAddressId(newAddress.id);
                        setShowAddressForm(false);
                        success('Shipping address saved successfully');
                      } catch (error) {
                        console.error('Error saving address:', error);
                        showError('Failed to save address');
                      } finally {
                        setSavingAddress(false);
                      }
                    }}
                    onCancel={() => setShowAddressForm(false)}
                    loading={savingAddress}
                  />
                ) : addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{address.full_name}</p>
                              {address.is_default && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{address.street_address}</p>
                            <p className="text-sm text-gray-700">
                              {address.city}, {address.state} - {address.pin_code}
                            </p>
                            <p className="text-sm text-gray-700">Phone: {address.phone_number}</p>
                          </div>
                          <div className="ml-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedAddressId === address.id
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedAddressId === address.id && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">Please add a shipping address to proceed</p>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-800">
                  <Truck className="h-4 w-4 text-green-600 mr-2" />
                  <span>Free shipping on orders above ₹500</span>
                </div>
                <div className="flex items-center text-sm text-gray-800">
                  <Shield className="h-4 w-4 text-blue-600 mr-2" />
                  <span>Secure payment with Razorpay</span>
                </div>
                <div className="flex items-center text-sm text-gray-800">
                  <Package className="h-4 w-4 text-purple-600 mr-2" />
                  <span>7 days replacement policy</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={processing || cartItems.length === 0 || !selectedAddress}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                {processing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </div>
                )}
              </Button>

              {/* Security Note */}
              <p className="text-xs text-gray-700 text-center mt-4">
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
