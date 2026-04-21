'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Order, Profile } from '@/types';
import { User, MapPin, Phone, Mail, CheckCircle, Package, Edit2, LogOut, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/contexts';

export default function ProfilePage() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({
    full_name: '',
    phone: '',
    address: ''
  });
  const { success, error } = useToast();

  // Removed authentication redirect - allow browsing without signin

  useEffect(() => {
    if (user && session) {
      fetchProfileData();
      fetchOrderHistory();
    }
  }, [user, session]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        const profileData = data as Profile;
        setProfileData(profileData);
        setEditForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrderHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product (*)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data && !error) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      error('Please sign in to update your profile');
      return;
    }

    try {
      // Create update data object
      const updateData = {
        full_name: editForm.full_name || '',
        phone: editForm.phone || null,
        address: editForm.address || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (!updateError) {
        // Update the profileData with the new values
        if (profileData) {
          setProfileData({
            ...profileData,
            ...editForm,
            updated_at: new Date().toISOString()
          });
        }
        setIsEditing(false);
        success('Profile updated successfully!');
      } else {
        console.error('Error updating profile:', updateError);
        error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      full_name: profileData?.full_name || '',
      phone: profileData?.phone || '',
      address: profileData?.address || ''
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8" style={{ backgroundColor: '#dcfce7' }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
                <p className="text-gray-600 mb-6">Sign in to view and manage your profile information</p>
                <div className="space-x-4">
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6"
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
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8" style={{ backgroundColor: '#dcfce7' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Profile Information */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <div className="md:col-span-1">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 rounded-full mx-auto mb-4 p-1">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      {profileData?.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt="Profile Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {profileData?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profileData?.full_name || 'User'}
                </h2>
                <p className="text-gray-600 font-medium">{user.email}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Authenticated
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="md:col-span-2">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">Save Changes</Button>
                      <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                        <p className="text-gray-900 font-medium">{profileData?.full_name || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                        <p className="text-gray-900 font-medium">{profileData?.phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                        <p className="text-gray-900 font-medium">{profileData?.address || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!isEditing && (
                  <div className="mt-6 pt-6 border-t border-purple-200">
                    <Button 
                      onClick={handleEditProfile} 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order History Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Order History</h3>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Order #{order.id.slice(0, 8)}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{order.order_items?.length || 0} items</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">${order.total_amount.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-12 text-center border border-purple-100">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h4>
                <p className="text-gray-600 mb-6">Start shopping to see your order history here</p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6"
                >
                  Start Shopping
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
