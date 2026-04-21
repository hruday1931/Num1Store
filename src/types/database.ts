export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name?: string;
          phone?: string;
          address?: string;
          avatar_url?: string;
          is_vendor?: boolean;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          store_name: string;
          store_description?: string;
          store_logo?: string;
          phone_number?: string;
          pickup_address?: string;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vendors']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['vendors']['Row']>;
      };
      products: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string;
          price: number;
          category: string;
          images: string[];
          inventory_count: number;
          is_active: boolean;
          weight?: number;
          dimensions?: {
            length?: number;
            breadth?: number;
            height?: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          total_amount: number;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          payment_method?: 'online' | 'cod';
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          shipping_address: string;
          awb_code?: string;
          shiprocket_order_id?: string;
          pickup_status?: 'pending' | 'requested' | 'scheduled' | 'picked';
          shipping_method?: 'standard' | 'express';
          estimated_delivery?: string;
          delivered_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['order_items']['Row']>;
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['wishlist']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['wishlist']['Row']>;
      };
      cart: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
        };
        Insert: Omit<Database['public']['Tables']['cart']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['cart']['Row']>;
      };
      shipping_addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          street_address: string;
          city: string;
          state: string;
          pin_code: string;
          phone_number: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shipping_addresses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shipping_addresses']['Row']>;
      };
    };
  };
}
