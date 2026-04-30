"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "@/utils/supabase/client";
import { useAuth } from "./auth-context";

// Create Supabase client only at runtime, not build time
let supabase: ReturnType<typeof supabaseClient> | null = null;
const getSupabase = () => {
  if (!supabase) {
    supabase = supabaseClient();
  }
  return supabase;
};

interface WishlistItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
  products?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    description?: string;
  };
}

interface WishlistItemDB {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    try {
      if (user) {
        fetchWishlistItems();
      } else {
        setWishlistItems([]);
        setLoading(false);
      }
    } catch (error) {
      console.warn('Error in wishlist useEffect:', error);
      setWishlistItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWishlistItems = async () => {
    if (!user) return;

    try {
      const client = getSupabase();
      if (!client) return;
      
      const { data, error } = await client
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        // Check if it's a table not found error
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Wishlist table does not exist yet. Wishlist functionality disabled.');
          setWishlistItems([]);
        } else {
          throw error;
        }
      } else {
        // Fetch product details separately for each wishlist item
        const wishlistWithProducts = await Promise.all(
          (data as WishlistItemDB[] || []).map(async (item: WishlistItemDB) => {
            try {
              const client = getSupabase();
              if (!client) return item;
              
              const { data: productData, error: productError } = await client
                .from('products')
                .select('id, name, price, images, description')
                .eq('id', item.product_id)
                .single();
              
              return {
                ...item,
                products: productError ? undefined : productData
              } as WishlistItem;
            } catch (err) {
              console.warn('Error fetching product for wishlist item:', err);
              return {
                ...item,
                products: undefined
              } as WishlistItem;
            }
          })
        );
        
        setWishlistItems(wishlistWithProducts);
      }
    } catch (error) {
      console.warn('Error fetching wishlist items, using empty wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const client = getSupabase();
      if (!client) throw new Error('Database not available');
      
      // Check if item already exists in wishlist
      const existingItem = wishlistItems?.find(item => item.product_id === productId);

      if (existingItem) {
        return; // Item already in wishlist
      }

      // Add new item to wishlist
      const { data, error } = await client
        .from('wishlist')
        .insert({
          product_id: productId,
          user_id: user.id
        } as any)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Wishlist table does not exist yet. Cannot add items to wishlist.');
          return;
        }
        throw error;
      }
      
      // Fetch the complete item with product details
      try {
        const client = getSupabase();
        if (!client) return;
        
        const { data: productData, error: productError } = await client
          .from('products')
          .select('id, name, price, images, description')
          .eq('id', productId)
          .single();
        
        const completeItem: WishlistItem = {
          ...(data as WishlistItemDB),
          products: productError ? undefined : productData
        };
        
        setWishlistItems(prev => [...prev, completeItem]);
      } catch (fetchError) {
        console.warn('Error fetching complete wishlist item, using basic data:', fetchError);
        // Use the basic data without product details
        if (data) {
          setWishlistItems(prev => [...prev, data]);
        }
      }
    } catch (error) {
      console.warn('Error adding to wishlist, operation failed:', error);
      // Don't throw error to prevent app crash
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const client = getSupabase();
      if (!client) return;
      
      const { error } = await client
        .from('wishlist')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Wishlist table does not exist yet. Cannot remove items from wishlist.');
          return;
        }
        throw error;
      }
      
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
    } catch (error) {
      console.warn('Error removing from wishlist, operation failed:', error);
      // Don't throw error to prevent app crash
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems?.some(item => item?.product_id === productId) || false;
  };

  const clearWishlist = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      const client = getSupabase();
      if (!client) return;
      
      const { error } = await client
        .from('wishlist')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Wishlist table does not exist yet. Cannot clear wishlist.');
          setWishlistItems([]);
          return;
        }
        throw error;
      }
      setWishlistItems([]);
    } catch (error) {
      console.warn('Error clearing wishlist, operation failed:', error);
      setWishlistItems([]); // Clear local state even if database operation fails
    }
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
