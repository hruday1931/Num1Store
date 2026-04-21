'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts';
import { User, Store, Lock, Mail, Phone, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import type { Profile, Vendor } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  
  // Profile settings
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: ''
  });
  
  // Shop settings
  const [shopForm, setShopForm] = useState({
    store_name: '',
    phone_number: ''
  });
  
  // Password settings
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
      setProfileForm(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() as { data: Profile | null; error: any };

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Don't return, continue with null profile
      }

      // Always set profile (even if null) to prevent crashes
      setProfile(profileData);
      
      // Update form with profile data or defaults
      setProfileForm(prev => ({
        ...prev,
        full_name: profileData?.full_name || ''
      }));

      // Fetch vendor data if user is a vendor
      if (profileData?.is_vendor) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle() as { data: Vendor | null; error: any };

        if (vendorError) {
          console.error('Error fetching vendor:', vendorError);
        }
        
        setVendor(vendorData);
        if (vendorData) {
          setShopForm(prev => ({
            ...prev,
            store_name: vendorData.store_name || '',
            phone_number: vendorData.phone_number || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // showMessage function replaced by useToast hook

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Check if profile exists, if not create it
      if (!profile) {
        const { error: insertError } = await (supabase as any)
          .from('profiles')
          .insert({
            id: user.id,
            full_name: profileForm.full_name,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        
        // Create local profile object
        setProfile({
          id: user.id,
          full_name: profileForm.full_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            full_name: profileForm.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        // Update local state
        setProfile(prev => prev ? { ...prev, full_name: profileForm.full_name } : null);
      }
      
      success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vendor) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('vendors')
        .update({
          store_name: shopForm.store_name,
          phone_number: shopForm.phone_number,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setVendor(prev => prev ? { ...prev, store_name: shopForm.store_name, phone_number: shopForm.phone_number } : null);
      success('Shop settings updated successfully!');
    } catch (err) {
      console.error('Error updating shop:', err);
      error('Failed to update shop settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      error('New passwords do not match.');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });

      if (error) throw error;

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      success('Password updated successfully!');
    } catch (err) {
      console.error('Error updating password:', err);
      error('Failed to update password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E6E6FA' }}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <div className="h-6 bg-white/50 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-10 bg-white/50 rounded"></div>
                  <div className="h-10 bg-white/50 rounded"></div>
                  <div className="h-10 bg-white/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E6E6FA' }}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to access settings</h2>
            <p className="text-gray-600 mb-6">Manage your profile, shop settings, and account security</p>
            <div className="space-x-4">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="bg-gradient-to-r from-pink-500 to-green-500 hover:from-pink-600 hover:to-green-600 text-white font-medium px-6"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6E6FA', minHeight: '100vh' }}>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Toast notifications handled by ToastContainer */}

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100">
            <div className="px-6 py-4 border-b border-purple-100">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Profile Picture Upload */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="h-12 w-12 text-purple-600" />
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full shadow-lg transition-colors"
                      title="Upload profile picture"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
                    <p className="text-sm text-gray-500">Upload a profile picture to personalize your account</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={profileForm.full_name || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={profileForm.email || ''}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed placeholder:text-gray-400"
                      placeholder="Email cannot be changed here"
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-gradient-to-r from-pink-500 to-green-500 hover:from-pink-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-white font-medium px-6 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Shop Settings - Only for vendors */}
          {profile?.is_vendor && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100">
              <div className="px-6 py-4 border-b border-purple-100">
                <div className="flex items-center space-x-2">
                  <Store className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Shop Settings</h2>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleShopSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name
                    </label>
                    <input
                      type="text"
                      id="store_name"
                      value={shopForm.store_name || ''}
                      onChange={(e) => setShopForm(prev => ({ ...prev, store_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
                      placeholder="Enter your store name"
                      required
                      autoComplete="organization"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        id="phone_number"
                        value={shopForm.phone_number || ''}
                        onChange={(e) => setShopForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
                        placeholder="Enter your business phone number"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-gradient-to-r from-pink-500 to-green-500 hover:from-pink-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-white font-medium px-6 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      {saving ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Save className="h-4 w-4" />
                          <span>Save Shop Settings</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Account Security */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100">
            <div className="px-6 py-4 border-b border-purple-100">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      id="new_password"
                      value={passwordForm.new_password || ''}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
                      placeholder="Enter new password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      id="confirm_password"
                      value={passwordForm.confirm_password || ''}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
                      placeholder="Confirm new password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving || !passwordForm.new_password || !passwordForm.confirm_password}
                    className="bg-gradient-to-r from-pink-500 to-green-500 hover:from-pink-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-white font-medium px-6 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>Change Password</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
