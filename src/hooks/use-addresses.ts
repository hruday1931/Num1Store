'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/utils/supabase/client';
import { AddressData } from '../types';

export function useAddresses() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Auth Check: Ensure user is authenticated before fetching addresses
      const { data: { user }, error: authError } = await supabaseClient().auth.getUser();
      if (authError) {
        console.log('Auth Error:', JSON.stringify(authError, null, 2));
        setAddresses([]);
        setError('Authentication error: Please sign in again');
        return;
      }
      
      if (!user) {
        console.log('No authenticated user found');
        setAddresses([]);
        setError('User not authenticated: Please sign in to view addresses');
        return;
      }

      console.log('Fetching addresses for user:', user.id);
      
      // Table Verification: Using shipping_addresses table name
      const { data, error } = await supabaseClient()
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }) as { data: AddressData[] | null, error: any };

      if (error) {
        // Detailed Logging: Show full error object with JSON.stringify
        console.log('Full Error Object:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Failed to load addresses';
        
        // Handle empty error object case
        if (!error || Object.keys(error).length === 0) {
          errorMessage = 'Database connection error: Please check your connection and try again';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'Table not found: addresses table does not exist';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied: You do not have access to view addresses';
        } else if (error.code === 'PGRST301') {
          errorMessage = 'Relation not found: Please check database schema';
        } else if (error.message?.includes('permission')) {
          errorMessage = 'Permission denied: Check RLS policies for addresses';
        } else if (error.message) {
          errorMessage = `Database error: ${error.message}`;
        } else {
          // Fallback for unknown errors
          errorMessage = `Unknown database error (code: ${error.code || 'none'})`;
        }
        
        setError(errorMessage);
        setAddresses([]);
      } else {
        console.log('Successfully loaded addresses:', data?.length || 0, 'items');
        // Add Address Fallback: Ensure addresses array is never null/undefined
        setAddresses(data || []);
        
        // Log address details for debugging
        if (data && data.length > 0) {
          console.log('Address IDs:', data.map(addr => addr.id));
        } else {
          console.log('No addresses found for user');
        }
      }
    } catch (err) {
      // Detailed Logging: Show full error object for catch block too
      console.log('Full Catch Error Object:', JSON.stringify(err, null, 2));
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred';
      setError(`Failed to load addresses: ${errorMessage}`);
      // Add Address Fallback: Ensure addresses array is never null/undefined
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async (addressData: Omit<AddressData, 'id' | 'user_id' | 'is_default'>) => {
    try {
      const { data: { user } } = await supabaseClient().auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If this is the first address, make it default by default
      const shouldSetDefault = addresses.length === 0;

      const { data, error } = await (supabaseClient()
        .from('shipping_addresses') as any)
        .insert({
          user_id: user.id,
          ...addressData,
          is_default: shouldSetDefault
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving address:', error);
        let errorMessage = 'Failed to save address';
        
        if (error.code === 'PGRST116') {
          errorMessage = 'Table not found: addresses table does not exist';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied: You do not have permission to save addresses';
        } else if (error.code === '23505') {
          errorMessage = 'Duplicate address: This address already exists';
        } else if (error.message) {
          errorMessage = `Database error: ${error.message}`;
        }
        
        throw new Error(errorMessage);
      }

      await loadAddresses(); // Reload addresses
      return data;
    } catch (err) {
      console.error('Error saving address:', err);
      throw err;
    }
  };

  const updateAddress = async (id: string, addressData: Partial<Omit<AddressData, 'id' | 'user_id'>>) => {
    try {
      const { data: { user } } = await supabaseClient().auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If setting as default, unset other defaults
      if (addressData.is_default) {
        await (supabaseClient()
          .from('shipping_addresses') as any)
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await (supabaseClient()
        .from('shipping_addresses') as any)
        .update(addressData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating address:', error);
        throw new Error('Failed to update address');
      }

      await loadAddresses(); // Reload addresses
      return data;
    } catch (err) {
      console.error('Error updating address:', err);
      throw err;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const { data: { user } } = await supabaseClient().auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabaseClient()
        .from('shipping_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting address:', error);
        throw new Error('Failed to delete address');
      }

      await loadAddresses(); // Reload addresses
    } catch (err) {
      console.error('Error deleting address:', err);
      throw err;
    }
  };

  const setDefaultAddress = async (id: string) => {
    await updateAddress(id, { is_default: true });
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  return {
    addresses,
    loading,
    error,
    loadAddresses,
    saveAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
