export interface User {
  id: string;
  email: string;
  role: 'admin' | 'seller' | 'customer';
  profile?: Profile;
}

export interface Profile {
  id: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_vendor?: boolean;
  subscription_status?: 'active' | 'inactive' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  store_logo?: string;
  phone_number?: string;
  is_approved: boolean;
  is_subscribed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorSubscription {
  id: string;
  user_id: string;
  vendor_id: string;
  plan_type: 'basic' | 'standard' | 'premium';
  start_date: string;
  end_date: string;
  is_active: boolean;
  price_paid: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon_name?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  inventory_count: number;
  rating?: number;
  is_active: boolean;
  status: 'active' | 'inactive';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  delivery_status?: 'ordered' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  current_location?: string;
  awb_code?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface AddressData {
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
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          full_name?: string;
          phone?: string;
          address?: string;
          avatar_url?: string;
          is_vendor?: boolean;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'expired';
        };
        Update: {
          full_name?: string;
          phone?: string;
          address?: string;
          avatar_url?: string;
          is_vendor?: boolean;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'expired';
          updated_at?: string;
        };
      };
      vendors: {
        Row: Vendor;
        Insert: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Vendor>;
      };
      vendor_subscriptions: {
        Row: VendorSubscription;
        Insert: Omit<VendorSubscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<VendorSubscription>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Category>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>> | { status?: 'active' | 'inactive' };
      };
      orders: {
        Row: Order;
        Insert: {
          customer_id: string;
          total_amount: number;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          shipping_address: string;
          awb_code?: string;
          estimated_delivery?: string;
        };
        Update: {
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          shipping_address?: string;
          delivery_status?: 'ordered' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
          current_location?: string;
          awb_code?: string;
          estimated_delivery?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id'>;
        Update: Partial<OrderItem>;
      };
      wishlist: {
        Row: WishlistItem;
        Insert: Pick<WishlistItem, 'user_id' | 'product_id'>;
        Update: Partial<WishlistItem>;
      };
      cart: {
        Row: CartItem;
        Insert: {
          user_id: string;
          product_id: string;
          quantity: number;
        };
        Update: {
          quantity?: number;
        };
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
        Insert: {
          user_id: string;
          full_name: string;
          street_address: string;
          city: string;
          state: string;
          pin_code: string;
          phone_number: string;
          is_default?: boolean;
        };
        Update: {
          full_name?: string;
          street_address?: string;
          city?: string;
          state?: string;
          pin_code?: string;
          phone_number?: string;
          is_default?: boolean;
        };
      };
    };
  };
}
