export interface ShiprocketAuthResponse {
  token: string;
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
  is_approved: boolean;
}

export interface ShiprocketAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}

export interface ShiprocketOrderItem {
  name: string;
  sku?: string;
  units: number;
  selling_price: number;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

export interface ShipmentRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_pincode?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShipmentResponse {
  shipment_id: number;
  order_id: string;
  shipment_id_unique: string;
  status: string;
  status_code: number;
  onboarding_completed: boolean;
  courier_id: number;
  courier_name: string;
  awb_code: string;
  courier_status: string;
  weight: string;
  dimensions: string;
  etd: string;
  additional_fields: any;
}

export interface PickupRequest {
  shipment_id: number[];
}

export interface PickupResponse {
  pickup_id: number;
  pickup_generated_date: string;
  scheduled_date: string;
  pickup_time: string;
  pickup_location: string;
  status: string;
  pickup_status_code: number;
  shipments: any[];
}

export interface LabelResponse {
  label_url: string;
  awb_number: string;
  order_id: string;
  shipment_id: number;
}

class ShiprocketService {
  private baseURL = 'https://apiv2.shiprocket.in/v1/external';
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Shiprocket authentication failed: ${response.statusText}`);
    }

    const data: ShiprocketAuthResponse = await response.json();
    this.token = data.token;
    // Token expires after 24 hours
    this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours for safety

    return this.token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.authenticate();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shiprocket API error: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async createShipment(shipmentData: ShipmentRequest): Promise<ShipmentResponse> {
    return this.makeRequest<ShipmentResponse>('/shipments/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async generatePickup(shipmentIds: number[]): Promise<PickupResponse> {
    return this.makeRequest<PickupResponse>('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    });
  }

  async getLabel(shipmentId: number): Promise<LabelResponse> {
    return this.makeRequest<LabelResponse>(`/courier/label/shipment/${shipmentId}`, {
      method: 'GET',
    });
  }

  async trackShipment(awbCode: string): Promise<any> {
    return this.makeRequest<any>(`/courier/track/awb/${awbCode}`, {
      method: 'GET',
    });
  }

  // Method to register pickup location for vendor
  async registerPickupLocation(vendorData: {
    vendorId: string;
    storeName: string;
    pickupAddress: {
      name: string;
      email: string;
      phone: string;
      address: string;
      address_2?: string;
      city: string;
      state: string;
      country: string;
      pin_code: string;
    };
  }): Promise<{ success: boolean; message: string; pickupLocationId?: string; locationTag?: string }> {
    try {
      // Validate required fields
      const requiredFields: (keyof typeof vendorData.pickupAddress)[] = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'pin_code'];
      const missingFields = requiredFields.filter(field => !vendorData.pickupAddress[field]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          message: `Missing required pickup address fields: ${missingFields.join(', ')}`
        };
      }

      // Prepare pickup location data for Shiprocket API
      const pickupData = {
        name: vendorData.pickupAddress.name,
        email: vendorData.pickupAddress.email,
        phone: vendorData.pickupAddress.phone,
        address: vendorData.pickupAddress.address,
        address_2: vendorData.pickupAddress.address_2 || '',
        city: vendorData.pickupAddress.city,
        state: vendorData.pickupAddress.state,
        country: vendorData.pickupAddress.country,
        pin_code: vendorData.pickupAddress.pin_code,
        is_active: true
      };

      try {
        // Try to add pickup location via Shiprocket API
        const response = await this.makeRequest<any>('/settings/company/addpickup', {
          method: 'POST',
          body: JSON.stringify(pickupData),
        });

        if (response && response.pickup_location_id) {
          const locationTag = `${vendorData.storeName.replace(/\s+/g, '_')}_${vendorData.vendorId}`;
          
          return {
            success: true,
            message: 'Pickup location registered successfully in Shiprocket',
            pickupLocationId: response.pickup_location_id.toString(),
            locationTag: locationTag
          };
        } else {
          throw new Error('Invalid response from Shiprocket API');
        }
      } catch (apiError) {
        // If API call fails, fallback to manual registration preparation
        console.warn('Shiprocket pickup location API failed, preparing for manual registration:', apiError);
        
        const locationTag = `${vendorData.storeName.replace(/\s+/g, '_')}_${vendorData.vendorId}`;
        
        return {
          success: true,
          message: 'Pickup location prepared for manual registration. Please add this location in Shiprocket dashboard.',
          pickupLocationId: `MANUAL_${vendorData.vendorId}_${Date.now()}`,
          locationTag: locationTag
        };
      }
      
    } catch (error) {
      console.error('Error registering pickup location:', error);
      return {
        success: false,
        message: `Failed to register pickup location: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Method to create multi-vendor shipments
  async createMultiVendorShipments(orderData: {
    orderId: string;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      address: string;
      address_2?: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };
    vendorGroups: Array<{
      vendorId: string;
      locationTag: string;
      items: Array<{
        name: string;
        sku?: string;
        quantity: number;
        price: number;
        weight?: number;
        length?: number;
        breadth?: number;
        height?: number;
      }>;
    }>;
    paymentMethod: string;
    orderDate: string;
  }): Promise<Array<{ success: boolean; shipment?: ShipmentResponse; error?: string; vendorId: string }>> {
    const results = [];

    for (const vendorGroup of orderData.vendorGroups) {
      try {
        const shipmentData: ShipmentRequest = {
          order_id: `${orderData.orderId}_V${vendorGroup.vendorId}`,
          order_date: orderData.orderDate,
          pickup_location: vendorGroup.locationTag,
          billing_customer_name: orderData.customerInfo.name,
          billing_last_name: '',
          billing_address: orderData.customerInfo.address,
          billing_address_2: orderData.customerInfo.address_2 || '',
          billing_city: orderData.customerInfo.city,
          billing_state: orderData.customerInfo.state,
          billing_country: orderData.customerInfo.country,
          billing_pincode: orderData.customerInfo.pincode,
          billing_email: orderData.customerInfo.email,
          billing_phone: orderData.customerInfo.phone,
          shipping_is_billing: true,
          order_items: vendorGroup.items.map(item => ({
            name: item.name,
            sku: item.sku || '',
            units: item.quantity,
            selling_price: item.price,
            weight: item.weight || 0.5,
            length: item.length || 10,
            breadth: item.breadth || 10,
            height: item.height || 5,
          })),
          payment_method: orderData.paymentMethod,
          sub_total: vendorGroup.items.reduce((total, item) => total + (item.price * item.quantity), 0),
          length: vendorGroup.items[0]?.length || 10,
          breadth: vendorGroup.items[0]?.breadth || 10,
          height: vendorGroup.items[0]?.height || 5,
          weight: vendorGroup.items.reduce((total, item) => total + ((item.weight || 0.5) * item.quantity), 0),
        };

        const shipment = await this.createShipment(shipmentData);
        
        results.push({
          success: true,
          shipment,
          vendorId: vendorGroup.vendorId
        });

      } catch (error) {
        console.error(`Failed to create shipment for vendor ${vendorGroup.vendorId}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          vendorId: vendorGroup.vendorId
        });
      }
    }

    return results;
  }

  // Helper method to convert order data to Shiprocket format
  static convertOrderToShipment(order: any, orderItems: any[]): ShipmentRequest {
    const firstItem = orderItems[0];
    
    // Validate required fields
    const requiredFields = ['customer_name', 'address', 'city', 'state', 'pincode', 'customer_phone'];
    const missingFields = requiredFields.filter(field => !order[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required customer information: ${missingFields.join(', ')}. Please ensure order has complete customer details.`);
    }
    
    return {
      order_id: order.id.toString(),
      order_date: order.created_at,
      pickup_location: "Primary", // This can be made configurable
      billing_customer_name: order.customer_name || 'Customer',
      billing_last_name: '',
      billing_address: order.address || '',
      billing_address_2: '',
      billing_city: order.city || '',
      billing_state: order.state || '',
      billing_country: order.country || 'India',
      billing_pincode: order.pincode || '',
      billing_email: order.customer_email || 'customer@example.com',
      billing_phone: order.customer_phone || '',
      shipping_is_billing: true, // Assuming shipping address is same as billing
      order_items: orderItems.map(item => ({
        name: item.name || item.product_name || 'Product',
        sku: item.sku || '',
        units: item.quantity || 1,
        selling_price: item.price || item.amount || 0,
        weight: item.weight || 0.5, // Default weight in kg
        length: item.length || 10,
        breadth: item.breadth || 10,
        height: item.height || 5,
      })),
      payment_method: order.payment_method || 'COD',
      sub_total: order.total_amount || 0,
      length: firstItem?.length || 10,
      breadth: firstItem?.breadth || 10,
      height: firstItem?.height || 5,
      weight: orderItems.reduce((total, item) => total + (item.weight || 0.5), 0),
    };
  }
}

export const shiprocketService = new ShiprocketService();
