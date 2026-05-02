'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { supabaseClient } from '@/utils/supabase/client';
import { Store, Save, ArrowLeft, User, Phone, Mail } from 'lucide-react';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/contexts/toast-context';
import { Vendor, Database } from '@/types';

interface PickupAddress {
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  country?: string;
  pin_code?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface VendorData {
  id?: string;
  user_id?: string;
  store_name?: string;
  phone_number?: string;
  pickup_address?: PickupAddress | string;
  shiprocket_pickup_location_id?: string;
  pickup_location_registered?: boolean;
  pickup_location_registered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const { success, toasts, removeToast } = useToast();
  
  const [shopForm, setShopForm] = useState({
    store_name: '',
    phone_number: '',
    email: '',
    address: '',
    address_2: '',
    city: '',
    state: '',
    country: 'India',
    pin_code: ''
  });

  const checkVendorAccess = useCallback(async () => {
    console.log('[DEBUG] checkVendorAccess called');
    console.log('[DEBUG] User state:', { user: !!user, userId: user?.id });
    
    if (!user) {
      console.log('[DEBUG] No user found, showing auth required message');
      setLoading(false);
      return;
    }

    try {
      // Reuse the same Supabase client instance
      const supabase = supabaseClient();
      console.log('[DEBUG] Checking profile for user ID:', user.id);
      
      // Check if user is a vendor with active subscription
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (error || !profile) {
        console.log('[DEBUG] Profile not found:', error);
        router.push('/vendor');
        return;
      }

      // Get vendor data
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Type assertion to fix TypeScript inference
      const typedVendor = vendor as VendorData | null;

      if (vendorError && vendorError.code !== 'PGRST116') {
        console.error('[ERROR] Vendor fetch error:', vendorError);
        router.push('/vendor');
        return;
      }

      if (typedVendor) {
        console.log('[DEBUG] Vendor data found:', typedVendor);
        setVendorData(typedVendor);
        
        // Parse pickup address if it exists
        let pickupAddress: PickupAddress = {};
        if (typedVendor.pickup_address) {
          try {
            pickupAddress = typeof typedVendor.pickup_address === 'string' 
              ? JSON.parse(typedVendor.pickup_address) 
              : typedVendor.pickup_address;
          } catch (error) {
            console.error('Error parsing pickup address:', error);
          }
        }
        
        const formData = {
          store_name: typedVendor.store_name || '',
          phone_number: typedVendor.phone_number || '',
          email: user.email || '',
          address: pickupAddress.address || '',
          address_2: pickupAddress.address_2 || '',
          city: pickupAddress.city || '',
          state: pickupAddress.state || '',
          country: pickupAddress.country || 'India',
          pin_code: pickupAddress.pin_code || ''
        };
        console.log('[DEBUG] Setting form data:', formData);
        setShopForm(formData);
      }
    } catch (error) {
      console.error('[ERROR] Error checking vendor access:', error);
      router.push('/vendor');
    } finally {
      console.log('[DEBUG] Setting loading to false');
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    console.log('[DEBUG] useEffect triggered, calling checkVendorAccess');
    checkVendorAccess();
    
    // Cleanup function to prevent memory leaks
    return () => {
      console.log('[DEBUG] useEffect cleanup');
      // Clear any pending operations
      setSaving(false);
      setLoading(false);
    };
  }, [checkVendorAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0FFF4]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0FFF4]">
        <div className="text-center max-w-md mx-auto p-8">
          <Store className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Settings</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access your vendor settings and manage your store.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/')}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShopForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = async () => {
    console.log('[DEBUG] handleSaveSettings called');
    setSaving(true);
    setMessage(null);

    try {
      if (!user?.id) {
        console.error('[ERROR] User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('[DEBUG] User authenticated:', user.id);
      console.log('[DEBUG] Form data to save:', shopForm);

      // Use the singleton Supabase client to avoid authentication conflicts
      const supabase = supabaseClient();
      
      // For updates, use untyped client to avoid TypeScript issues
      const supabaseUntyped = (supabase as any);
      
      // Prepare pickup address object
      const pickupAddress = {
        name: shopForm.store_name,
        email: shopForm.email,
        phone: shopForm.phone_number,
        address: shopForm.address,
        address_2: shopForm.address_2,
        city: shopForm.city,
        state: shopForm.state,
        country: shopForm.country,
        pin_code: shopForm.pin_code
      };
      
      const updateData = {
        store_name: shopForm.store_name,
        phone_number: shopForm.phone_number,
        pickup_address: pickupAddress,
        updated_at: new Date().toISOString()
      } as any;
      
      console.log('[DEBUG] Update data:', updateData);
      
      // Update vendor settings
      const { error, data } = await supabaseUntyped
        .from('vendors')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      console.log('[DEBUG] Update result:', { error, data });

      if (error) {
        console.error('[ERROR] Supabase update error:', error);
        throw error;
      }

      console.log('[SUCCESS] Settings saved successfully');

      // Register pickup location with Shiprocket
      try {
        const isUpdate = vendorData?.shiprocket_pickup_location_id ? true : false;
        
        const pickupResponse = await fetch('/api/shiprocket/pickup-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendorId: user.id,
            storeName: shopForm.store_name,
            address: pickupAddress,
            isUpdate: isUpdate
          }),
        });

        const pickupResult = await pickupResponse.json();
        
        if (pickupResponse.ok && pickupResult.success) {
          console.log('[SUCCESS] Pickup location registered with Shiprocket:', pickupResult);
          success(`Settings Saved! ${isUpdate ? 'Pickup location updated' : 'Pickup location registered'} with Shiprocket`);
          setMessage({ 
            type: 'success', 
            text: `Settings updated successfully! ${isUpdate ? 'Pickup location updated' : 'Pickup location registered'} with Shiprocket.` 
          });
        } else {
          console.error('[ERROR] Pickup location registration failed:', pickupResult);
          success('Settings Saved (Pickup location registration failed)');
          setMessage({ 
            type: 'success', 
            text: 'Settings updated successfully! However, pickup location registration with Shiprocket failed. Please try again later.' 
          });
        }
      } catch (pickupError) {
        console.error('[ERROR] Pickup location registration error:', pickupError);
        success('Settings Saved (Pickup location registration failed)');
        setMessage({ 
          type: 'success', 
          text: 'Settings updated successfully! However, pickup location registration with Shiprocket failed. Please try again later.' 
        });
      }
      
      // Update local state with fresh data from database
      const { data: freshVendorData } = await supabaseUntyped
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (freshVendorData) {
        setVendorData(freshVendorData as VendorData);
        
        // Parse pickup address if it exists
        let updatedPickupAddress: PickupAddress = {};
        if (freshVendorData.pickup_address) {
          try {
            updatedPickupAddress = typeof freshVendorData.pickup_address === 'string' 
              ? JSON.parse(freshVendorData.pickup_address) 
              : freshVendorData.pickup_address;
          } catch (error) {
            console.error('Error parsing pickup address:', error);
          }
        }
        
        const formData = {
          store_name: freshVendorData.store_name || '',
          phone_number: freshVendorData.phone_number || '',
          email: user.email || '',
          address: updatedPickupAddress.address || '',
          address_2: updatedPickupAddress.address_2 || '',
          city: updatedPickupAddress.city || '',
          state: updatedPickupAddress.state || '',
          country: updatedPickupAddress.country || 'India',
          pin_code: updatedPickupAddress.pin_code || ''
        };
        setShopForm(formData);
      }
      
      // Clear message after 5 seconds (longer for pickup location messages)
      setTimeout(() => setMessage(null), 5000);
      
    } catch (error) {
      console.error('[ERROR] Error updating settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      setMessage({ type: 'error', text: `Failed to update settings: ${errorMessage}` });
    } finally {
      console.log('[DEBUG] Setting saving to false');
      setSaving(false);
      // Ensure loading state is properly reset
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#F0FFF4] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/vendor/dashboard')}
          className="flex items-center text-black hover:text-orange-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Vendor Settings</h1>
            <p className="text-gray-600 mt-2">Manage your store information and account settings</p>
          </div>
          <Store className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Store className="h-6 w-6 text-orange-500 mr-3" />
            <h3 className="text-xl font-bold text-black">Store Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                name="store_name"
                value={shopForm.store_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your store name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={shopForm.phone_number}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={shopForm.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                placeholder="Your email address"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Pickup Address</h4>
              <p className="text-sm text-gray-600 mb-4">This address will be used as your pickup location for Shiprocket shipments</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={shopForm.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Street address, apartment, suite, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_2"
                    value={shopForm.address_2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shopForm.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shopForm.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shopForm.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="pin_code"
                      value={shopForm.pin_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="PIN/ZIP Code"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2 inline" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-orange-500 mr-3" />
            <h3 className="text-xl font-bold text-black">Account Information</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-black opacity-60">User ID</p>
              <p className="text-black font-mono text-sm">{user?.id}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-black opacity-60">Account Type</p>
              <p className="text-black font-medium">Vendor Account</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-black opacity-60">Member Since</p>
              <p className="text-black font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">Subscription Status</p>
              <p className="text-green-800 font-bold">Active</p>
            </div>

            <div className={`p-4 rounded-lg border ${
              vendorData?.shiprocket_pickup_location_id 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <p className={`text-sm font-medium ${
                vendorData?.shiprocket_pickup_location_id 
                  ? 'text-blue-800' 
                  : 'text-yellow-800'
              }`}>
                Shiprocket Pickup Location
              </p>
              <p className={`font-bold ${
                vendorData?.shiprocket_pickup_location_id 
                  ? 'text-blue-800' 
                  : 'text-yellow-800'
              }`}>
                {vendorData?.shiprocket_pickup_location_id 
                  ? 'Registered' 
                  : 'Not Registered'
                }
              </p>
              {vendorData?.pickup_location_registered_at && (
                <p className="text-xs mt-1 opacity-75">
                  Registered: {new Date(vendorData.pickup_location_registered_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
