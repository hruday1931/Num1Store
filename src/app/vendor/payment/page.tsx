'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Shield, Truck, Loader2, Check } from 'lucide-react';
import { safeFetch } from '@/utils/fetch-wrapper';
import { Input } from '@/components/ui/input';

interface PaymentFormData {
  card_number: string;
  expiry_date: string;
  cvv: string;
  name_on_card: string;
  billing_zip: string;
}

interface VendorData {
  store_name: string;
  store_description: string;
  phone_number: string;
  plan_id: string;
  plan_name: string;
  plan_price: number;
}

export default function VendorPaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    card_number: '',
    expiry_date: '',
    cvv: '',
    name_on_card: '',
    billing_zip: ''
  });
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});

  useEffect(() => {
    // Retrieve vendor data from sessionStorage
    const storedData = sessionStorage.getItem('vendorFormData');
    if (!storedData) {
      router.push('/vendor');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setVendorData(data);
    } catch (error) {
      console.error('Error parsing vendor data:', error);
      router.push('/vendor');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number
    if (name === 'card_number') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } 
    // Format expiry date
    else if (name === 'expiry_date') {
      let formatted = value.replace(/\D/g, '');
      if (formatted.length >= 2) {
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Limit CVV to 3-4 digits
    else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Limit zip code to 10 characters
    else if (name === 'billing_zip') {
      const formatted = value.replace(/\s/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof PaymentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.card_number.replace(/\s/g, '') || formData.card_number.replace(/\s/g, '').length < 13) {
      newErrors.card_number = 'Valid card number is required';
    }

    if (!formData.expiry_date || !/^\d{2}\/\d{2}$/.test(formData.expiry_date)) {
      newErrors.expiry_date = 'Valid expiry date (MM/YY) is required';
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV is required';
    }

    if (!formData.name_on_card.trim()) {
      newErrors.name_on_card = 'Name on card is required';
    }

    if (!formData.billing_zip.trim()) {
      newErrors.billing_zip = 'Billing ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user || !vendorData) {
      router.push('/vendor');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing (in a real app, you'd integrate with Stripe/PayPal)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create vendor record and subscription
      const result = await safeFetch('/api/vendors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          store_name: vendorData.store_name,
          store_description: vendorData.store_description,
          phone_number: vendorData.phone_number,
          plan_id: vendorData.plan_id,
          plan_price: vendorData.plan_price
        }),
      });

      // Clear sessionStorage
      sessionStorage.removeItem('vendorFormData');

      // Update user role to 'seller' (this would typically be handled by the backend)
      // For now, we'll redirect to the dashboard
      router.push('/dashboard/seller');
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrors({ card_number: 'Payment failed. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    router.push('/vendor');
  };

  if (!user || !vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registration
          </button>
          
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Subscription
            </h1>
            <p className="text-gray-600">
              Secure payment processing for your {vendorData.plan_name} plan
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Store Name:</span>
              <span className="font-medium text-gray-900">{vendorData.store_name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Subscription Plan:</span>
              <span className="font-medium text-gray-900">{vendorData.plan_name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Billing Cycle:</span>
              <span className="font-medium text-gray-900">Monthly</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{vendorData.plan_price}/month
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h2>
          
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  name="name_on_card"
                  label="Name on Card"
                  placeholder="John Doe"
                  value={formData.name_on_card}
                  onChange={handleInputChange}
                  error={errors.name_on_card}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  name="card_number"
                  placeholder="1234 5678 9012 3456"
                  value={formData.card_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                    errors.card_number 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300'
                  }`}
                  maxLength={19}
                  required
                />
                {errors.card_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.card_number}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiry_date"
                  placeholder="MM/YY"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                    errors.expiry_date 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300'
                  }`}
                  maxLength={5}
                  required
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                    errors.cvv 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300'
                  }`}
                  maxLength={4}
                  required
                />
                {errors.cvv && (
                  <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Input
                  name="billing_zip"
                  label="Billing ZIP Code"
                  placeholder="12345"
                  value={formData.billing_zip}
                  onChange={handleInputChange}
                  error={errors.billing_zip}
                  required
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Secure Payment</p>
                  <p>Your payment information is encrypted and secure. We never store your card details on our servers.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Check className="h-5 w-5 mr-2" />
                    Complete Subscription - ₹{vendorData.plan_price}/month
                  </div>
                )}
              </Button>
              
              <p className="mt-4 text-center text-sm text-gray-500">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Your subscription will auto-renew monthly. You can cancel anytime.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
