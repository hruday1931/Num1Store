'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { VendorSubscriptionWrapper } from '@/components/forms/vendor-subscription-wrapper';
import { Loader2, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Interface for the profile data we're querying
interface VendorProfile {
  is_vendor?: boolean;
  subscription_status?: 'active' | 'inactive' | 'cancelled' | 'expired';
}

// Type guard to check if profile has vendor properties
function hasVendorProperties(profile: any): profile is VendorProfile {
  return profile && typeof profile === 'object' && 
         ('is_vendor' in profile || 'subscription_status' in profile);
}

export default function VendorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is already a vendor from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_vendor, subscription_status')
          .eq('id', user.id)
          .single();
        
        if (error) {
          // Handle specific database errors
          if (error.code === 'PGRST116') {
            console.log('Profile not found, user needs to create one');
          } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
            console.warn('Database schema needs update: missing vendor status columns');
          } else {
            console.error('Error checking vendor status:', error);
          }
          // In all error cases, assume user is not a vendor and show subscription form
        } else if (profile) {
          const vendorProfile = profile as VendorProfile;
          if (vendorProfile.is_vendor && vendorProfile.subscription_status === 'active') {
            // Redirect to vendor dashboard
            router.push('/vendor/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Unexpected error checking vendor status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVendorStatus();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking vendor status...</p>
        </div>
      </div>
    );
  }

  // If user is already a vendor, the redirect will happen above
  // Otherwise, show the subscription form
  return <VendorSubscriptionWrapper />;
}
