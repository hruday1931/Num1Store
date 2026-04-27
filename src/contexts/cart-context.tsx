"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "@/utils/supabase/client";

const supabase = supabaseClient();
import { useAuth } from "./auth-context";

export interface CartItem {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  created_at: string;
  products?: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize cart from localStorage for guest users
  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      // Load cart from localStorage for guest users
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        try {
          const parsedCart = JSON.parse(guestCart);
          // Only fetch products if cart has items
          if (parsedCart.length > 0) {
            // Fetch product details for guest cart items
            fetchGuestCartProducts(parsedCart);
          } else {
            setCartItems([]);
            setLoading(false);
          }
        } catch (error) {
          console.warn('Failed to parse guest cart from localStorage:', error);
          localStorage.removeItem('guestCart');
          setCartItems([]);
          setLoading(false);
        }
      } else {
        setCartItems([]);
        setLoading(false);
      }
    }
  }, [user]);

  const fetchGuestCartProducts = async (cartItems: CartItem[]) => {
    // Fetch product details for each guest cart item
    const cartWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, name, description, price, images')
            .eq('id', item.product_id)
            .single();
          
          return {
            ...item,
            products: productError ? undefined : productData
          };
        } catch (err) {
          console.warn('Error fetching product for guest cart item:', err);
          return {
            ...item,
            products: undefined
          };
        }
      })
    );
    
    setCartItems(cartWithProducts);
  };

  const fetchCartItems = async () => {
    if (!user) {
      console.log('Cart Debug: No user found, setting empty cart');
      setCartItems([]);
      setLoading(false);
      return;
    }

    console.log('Frontend User ID:', user.id);
    console.log('Cart Debug: Fetching cart items for user:', user.id);
    console.log('Cart Debug: Fetch timestamp:', new Date().toISOString());
    try {
      // Debug: Check if we can access the cart table at all
      const { data: allCartItems, error: allCartError } = await supabase
        .from('cart')
        .select('id, user_id, product_id, quantity')
        .limit(5);
      
      console.log('Frontend - All Cart Items (debug):', allCartItems);
      console.log('Frontend - All Cart Error (debug):', allCartError);
      
      // Debug: Try to verify RLS is working by checking auth.uid()
      const { data: authCheck } = await supabase
        .rpc('current_user_id');
      
      console.log('Frontend - Auth UID from RPC:', authCheck);
      
      // Add cache-busting by using a timestamp parameter
      const timestamp = Date.now();
      const { data, error } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        // Add a hint to prevent caching
        .limit(1000); // Large limit to get all items

      console.log('Raw Cart Data from frontend (timestamp:', timestamp, '):', data);
      console.log('Cart Debug: Query result - Data:', data, 'Error:', error);

      if (error) {
        // Check if it's a table not found error
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Cart table does not exist yet. Cart functionality disabled.');
          setCartItems([]);
        } else {
          console.warn('Error fetching cart items:', error);
          setCartItems([]);
        }
      } else {
        // Handle empty cart explicitly
        if (!data || data.length === 0) {
          console.log('Cart Debug: Cart is empty for user:', user.id);
          setCartItems([]);
        } else {
          console.log('Cart Debug: Found', data.length, 'cart items for user:', user.id);
          // Fetch product details separately for each cart item
          const cartWithProducts = await Promise.all(
            data.map(async (item: any) => {
              try {
                const { data: productData, error: productError } = await supabase
                  .from('products')
                  .select('id, name, description, price, images')
                  .eq('id', item.product_id)
                  .single();
                
                return {
                  ...item,
                  products: productError ? undefined : productData
                };
              } catch (err) {
                console.warn('Error fetching product for cart item:', err);
                return {
                  ...item,
                  products: undefined
                };
              }
            })
          );
          
          console.log('Cart Debug: Final cart items with products:', cartWithProducts);
          setCartItems(cartWithProducts);
        }
      }
    } catch (error) {
      console.warn('Error fetching cart items, using empty cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      // Guest user - add to localStorage
      const guestCart = localStorage.getItem('guestCart');
      let cart: CartItem[] = guestCart ? JSON.parse(guestCart) : [];
      
      // Check if item already exists in cart
      const existingItem = cart.find(item => item.product_id === productId);
      
      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        cart = cart.map(item => 
          item.product_id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          product_id: productId,
          user_id: 'guest',
          quantity,
          created_at: new Date().toISOString()
        };
        cart.push(newItem);
      }
      
      localStorage.setItem('guestCart', JSON.stringify(cart));
      // Fetch product details for the updated cart
      fetchGuestCartProducts(cart);
      return;
    }

    // Authenticated user - add to database
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === productId);

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        await updateQuantity(existingItem.id, newQuantity);
      } else {
        // Add new item to cart
        const { data, error } = await supabase
          .from('cart')
          .insert({
            product_id: productId,
            user_id: user.id,
            quantity
          } as any)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            console.warn('Cart table does not exist yet. Cannot add items to cart.');
            return;
          }
          throw error;
        }
        
        // Fetch the complete item with product details
        try {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, name, description, price, images')
            .eq('id', productId)
            .single();
          
          const completeItem = {
            ...(data as any),
            products: productError ? undefined : productData
          };
          
          setCartItems(prev => [...prev, completeItem]);
        } catch (fetchError) {
          console.warn('Error fetching complete cart item, using basic data:', fetchError);
          // Use the basic data without product details
          if (data) {
            setCartItems(prev => [...prev, data as any]);
          }
        }
      }
    } catch (error) {
      console.warn('Error adding to cart, operation failed:', error);
      // Don't throw error to prevent app crash
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (!user) {
      // Guest user - update localStorage
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        let cart: CartItem[] = JSON.parse(guestCart);
        cart = cart.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        );
        localStorage.setItem('guestCart', JSON.stringify(cart));
        // Fetch product details for the updated cart
        fetchGuestCartProducts(cart);
      }
      return;
    }

    // Authenticated user - update database
    try {
      const { error } = await (supabase as any)
        .from('cart')
        .update({ quantity })
        .eq('id', itemId);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Cart table does not exist yet. Cannot update quantity.');
          return;
        }
        throw error;
      }
      
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.warn('Error updating quantity, operation failed:', error);
      // Don't throw error to prevent app crash
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) {
      // Guest user - remove from localStorage
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        let cart: CartItem[] = JSON.parse(guestCart);
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('guestCart', JSON.stringify(cart));
        // Fetch product details for the updated cart
        fetchGuestCartProducts(cart);
      }
      return;
    }

    // Authenticated user - remove from database
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', itemId);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Cart table does not exist yet. Cannot remove items from cart.');
          return;
        }
        throw error;
      }
      
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.warn('Error removing from cart, operation failed:', error);
      // Don't throw error to prevent app crash
    }
  };

  const clearCart = async () => {
    if (!user) {
      // Guest user - clear localStorage
      localStorage.removeItem('guestCart');
      setCartItems([]);
      return;
    }

    // Authenticated user - clear database
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Cart table does not exist yet. Cannot clear cart.');
          setCartItems([]);
          return;
        }
        throw error;
      }
      setCartItems([]);
    } catch (error) {
      console.warn('Error clearing cart, operation failed:', error);
      setCartItems([]); // Clear local state even if database operation fails
    }
  };

  const cartCount = cartItems?.reduce((total, item) => total + (item?.quantity || 0), 0) || 0;
  const cartTotal = cartItems?.reduce((total, item) => total + (item?.products?.price || 0) * (item?.quantity || 0), 0) || 0;

  // Alias for removeFromCart to match the requested function name
  const removeItem = removeFromCart;

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    addToCart,
    removeFromCart,
    removeItem,
    updateQuantity,
    clearCart,
    fetchCartItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
