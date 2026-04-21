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
