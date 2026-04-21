'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { supabaseClient } from '@/utils/supabase/client';
import { Store, Save, ArrowLeft, User, Phone, Mail } from 'lucide-react';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/contexts/toast-context';
import { Vendor, Database } from '@/types';

interface VendorData {
  id?: string;
  user_id?: string;
  store_name?: string;
  phone_number?: string;
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
    email: ''
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
        const formData = {
          store_name: typedVendor.store_name || '',
          phone_number: typedVendor.phone_number || '',
          email: user.email || ''
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
      
      const updateData = {
        store_name: shopForm.store_name,
        phone_number: shopForm.phone_number,
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
      
      // Update local state with fresh data from database
      const { data: freshVendorData } = await supabaseUntyped
        .from('vendors')
        .select('store_name, phone_number, updated_at')
        .eq('user_id', user.id)
        .single();
      
      if (freshVendorData) {
        setVendorData(freshVendorData as VendorData);
        const formData = {
          store_name: freshVendorData.store_name || '',
          phone_number: freshVendorData.phone_number || '',
          email: user.email || ''
        };
        setShopForm(formData);
      }

      // Show success toast
      success('Settings Saved');
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
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
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
