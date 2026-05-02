/**
 * Shiprocket Integration Utilities
 * 
 * This file contains utility functions for integrating with Shiprocket API
 * for pickup location management and shipping services.
 */

// Shiprocket API endpoints
export const SHIPROCKET_AUTH_URL = 'https://apiv2.shiprocket.in/v1/external/auth/login';
export const SHIPROCKET_PICKUP_LOCATIONS_URL = 'https://apiv2.shiprocket.in/v1/external/settings/company/pickuplocations';

/**
 * Get Shiprocket JWT token using environment variables
 * @returns Promise<string> - JWT token for Shiprocket API
 */
export async function getShiprocketToken(): Promise<string> {
  try {
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shiprocket/auth`, {
      method: 'POST',
    });
    
    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Shiprocket');
    }
    
    const authData = await authResponse.json();
    if (!authData.success || !authData.token) {
      throw new Error('Invalid Shiprocket authentication response');
    }
    
    return authData.token;
  } catch (error) {
    console.error('Shiprocket token error:', error);
    throw new Error('Failed to get Shiprocket token');
  }
}

/**
 * Register or update a pickup location with Shiprocket
 * @param vendorId - Vendor user ID
 * @param storeName - Store name for pickup location
 * @param address - Complete address object
 * @param isUpdate - Whether this is an update operation
 * @returns Promise with pickup location details
 */
export async function registerPickupLocation(
  vendorId: string,
  storeName: string,
  address: {
    name: string;
    email: string;
    phone: string;
    address: string;
    address_2?: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
  },
  isUpdate: boolean = false
) {
  try {
    const response = await fetch('/api/shiprocket/pickup-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorId,
        storeName,
        address,
        isUpdate
      }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to register pickup location');
    }
    
    return result;
  } catch (error) {
    console.error('Pickup location registration error:', error);
    throw error;
  }
}

/**
 * Validate address data for Shiprocket requirements
 * @param address - Address object to validate
 * @returns Array of missing required fields
 */
export function validateAddress(address: any): string[] {
  const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'pin_code'];
  const missingFields = requiredFields.filter(field => !address[field]);
  
  return missingFields;
}

/**
 * Format error messages for user display
 * @param error - Error object or message
 * @returns User-friendly error message
 */
export function formatShiprocketError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle common Shiprocket error scenarios
  if (error.message) {
    if (error.message.includes('invalid pincode')) {
      return 'Invalid PIN code. Please check and enter a valid PIN code.';
    }
    if (error.message.includes('authentication')) {
      return 'Shiprocket authentication failed. Please contact support.';
    }
    if (error.message.includes('pickup location')) {
      return 'Failed to register pickup location. Please check your address details.';
    }
  }
  
  return 'An error occurred while processing your request. Please try again.';
}

/**
 * Check if Shiprocket credentials are configured
 * @returns Promise with configuration status
 */
export async function checkShiprocketConfig() {
  try {
    const response = await fetch('/api/shiprocket/auth', {
      method: 'GET',
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Shiprocket config check error:', error);
    return { configured: false, error: 'Failed to check configuration' };
  }
}

/**
 * Get vendor's pickup location details
 * @param vendorId - Vendor user ID
 * @returns Promise with pickup location information
 */
export async function getVendorPickupLocation(vendorId: string) {
  try {
    const response = await fetch(`/api/shiprocket/pickup-location?vendorId=${vendorId}`, {
      method: 'GET',
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to get pickup location');
    }
    
    return result;
  } catch (error) {
    console.error('Get pickup location error:', error);
    throw error;
  }
}
