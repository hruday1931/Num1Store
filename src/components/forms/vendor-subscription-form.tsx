'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/toast-context';
import { Store, CreditCard, Check, AlertCircle, Star, Zap, Shield, Headphones, Package, TrendingUp, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { PaymentModal } from '@/components/ui/payment-modal';

interface VendorFormData {
  store_name: string;
  phone_number: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Starter',
    price: 29.99,
    features: [
      'Up to 10 products',
      'Basic analytics dashboard',
      'Email support',
      'Standard seller profile'
    ]
  },
  {
    id: 'standard',
    name: 'Professional',
    price: 49.99,
    features: [
      'Unlimited Products',
      'Advanced analytics & insights',
      'Priority customer support',
      'Promotional tools & discounts',
      'Custom store branding'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Enterprise',
    price: 99.99,
    features: [
      'Unlimited Products',
      'Premium analytics suite',
      '24/7 Dedicated Support',
      'Advanced marketing automation',
      'Custom domain & branding',
      'API access & integrations'
    ]
  }
];

interface VendorSubscriptionFormProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function VendorSubscriptionForm({ onSuccess, onError }: VendorSubscriptionFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [formData, setFormData] = useState<VendorFormData>({
    store_name: '',
    phone_number: ''
  });
  const [errors, setErrors] = useState<Partial<VendorFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof VendorFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VendorFormData> = {};

    if (!formData.store_name.trim()) {
      newErrors.store_name = 'Store name is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    // Check if user exists at the very beginning
    if (!user) {
      alert('Please login first');
      router.push('/auth/signin');
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Show payment modal instead of processing directly
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    // Check if user exists (defensive programming)
    if (!user) {
      onError?.('User not found. Please log in again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      console.log('Starting database updates after successful payment...');
      
      // Create untyped supabase client to bypass Database type issues
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are missing');
      }
      
      const untypedSupabase = createClient(
        supabaseUrl,
        supabaseAnonKey
      );

      // Verify user ID is valid
      if (!user.id || typeof user.id !== 'string') {
        throw new Error('Invalid user ID: ' + JSON.stringify(user.id));
      }

      console.log('Updating profile for user ID:', user.id);
      console.log('Profile update data:', {
        is_vendor: true,
        subscription_status: 'active',
        store_name: formData.store_name
      });
      
      // Update user profile to mark as vendor with active subscription
      console.log('Executing profile update...');
      const { data: profileData, error: profileError } = await untypedSupabase
        .from('profiles')
        .update({
          is_vendor: true,
          subscription_status: 'active'
        })
        .eq('id', user.id)
        .select();

      console.log('Profile update response:', { data: profileData, error: profileError });

      if (profileError) {
        console.error('Profile Error Details:', JSON.stringify(profileError, null, 2));
        
        // Check if the error is related to missing columns
        if (profileError.message?.includes('column') && profileError.message?.includes('does not exist')) {
          throw new Error('Database schema error: Required columns are missing. Please run the schema update script.');
        }
        
        throw new Error(`Profile update failed: ${profileError.message}`);
      }
      
      console.log('Profile updated successfully:', profileData);
      console.log('Proceeding to vendor creation...');

      // Create vendor record
      console.log('Creating vendor record for user ID:', user.id);
      console.log('Vendor insert data:', {
        user_id: user.id,
        store_name: formData.store_name,
        phone_number: formData.phone_number,
        is_approved: true,
        is_subscribed: true
      });
      
      console.log('Executing vendor creation...');
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          store_name: formData.store_name,
          phone_number: formData.phone_number,
          is_approved: true,
          is_subscribed: true
        } as any)
        .select();

      console.log('Vendor creation response:', { data: vendorData, error: vendorError });

      if (vendorError) {
        console.error('Vendor Error Details:', JSON.stringify(vendorError, null, 2));
        
        // Check if the error is related to missing columns
        if (vendorError.message?.includes('column') && vendorError.message?.includes('does not exist')) {
          throw new Error('Database schema error: Required vendor table columns are missing. Please run the schema update script.');
        }
        
        throw new Error(`Vendor creation failed: ${vendorError.message}`);
      }
      
      console.log('Vendor created successfully:', vendorData);
      console.log('All database operations completed successfully');

      // Show success message and redirect
      onSuccess?.('Vendor account created successfully!');
      router.push('/vendor/dashboard');
      
    } catch (error) {
      // Enhanced error logging to capture all types of errors
      console.error('Complete Error Object:', error);
      console.error('Error Type:', typeof error);
      console.error('Error Constructor:', error?.constructor?.name);
      
      // Handle different types of errors
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        console.error('Error String:', error);
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        console.error('Error Object Keys:', Object.keys(error));
        console.error('Error Stringified:', JSON.stringify(error, null, 2));
        
        // Check for common error properties
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('details' in error && typeof error.details === 'string') {
          errorMessage = error.details;
        }
      }
      
      console.error('Final Error Message:', errorMessage);
      onError?.(`Account setup failed: ${errorMessage}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (message: string) => {
    onError?.(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePayment();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-lavender flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to become a vendor</p>
          <Button onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <Package className="h-8 w-8 text-gray-600" />;
      case 'standard':
        return <TrendingUp className="h-8 w-8 text-blue-600" />;
      case 'premium':
        return <Crown className="h-8 w-8 text-purple-600" />;
      default:
        return <Store className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-lavender">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <Store className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Become a Num1Store Vendor
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of successful sellers on Num1Store. Choose your perfect plan and start 
            selling to millions of customers today.
          </p>
          <div className="flex items-center justify-center mt-8 space-x-8">
            <div className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Selling Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  plan.recommended
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl'
                    : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${plan.recommended ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.recommended ? 'text-white' : 'text-gray-900'}`}>
                      ₹{plan.price}
                    </span>
                    <span className={`text-lg ${plan.recommended ? 'text-blue-100' : 'text-gray-600'}`}>
                      /month
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className={`h-5 w-5 mr-3 flex-shrink-0 ${plan.recommended ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={`text-sm ${plan.recommended ? 'text-blue-50' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? plan.recommended
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-blue-600 text-white shadow-lg'
                      : plan.recommended
                      ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Store Information Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Store Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store Name *
                </label>
                <Input
                  name="store_name"
                  placeholder="Enter your store name"
                  value={formData.store_name}
                  onChange={handleInputChange}
                  error={errors.store_name}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <Input
                  name="phone_number"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  error={errors.phone_number}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="text-center max-w-2xl mx-auto">
            <Button
              type="submit"
              size="lg"
              disabled={isProcessingPayment}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Processing Payment...
                </div>
              ) : (
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 mr-3" />
                  Pay Subscription - ₹{subscriptionPlans.find(p => p.id === selectedPlan)?.price}/month
                </div>
              )}
            </Button>
            
            <p className="mt-6 text-sm text-gray-500">
              By completing this payment, you agree to our Terms of Service and Privacy Policy.
            </p>
            <div className="flex items-center justify-center mt-4 space-x-4 text-xs text-gray-400">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Secure Payment
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Instant Setup
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        planName={subscriptionPlans.find(p => p.id === selectedPlan)?.name || 'Standard'}
        planPrice={subscriptionPlans.find(p => p.id === selectedPlan)?.price || 49.99}
        storeName={formData.store_name}
        phoneNumber={formData.phone_number}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
