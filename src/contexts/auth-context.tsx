"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "@/utils/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/types";

// Create Supabase client only at runtime, not build time
let supabase: ReturnType<typeof supabaseClient> | null = null;
const getSupabase = () => {
  if (!supabase) {
    supabase = supabaseClient();
  }
  return supabase;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth context loading timeout - forcing loading to false');
      setLoading(false);
      setSession(null);
      setUser(null);
    }, 2000); // Reduced to 2 second timeout

    // Get initial session and handle refresh
    const getInitialSession = async () => {
      try {
        const client = getSupabase();
        if (!client) {
          setLoading(false);
          return;
        }
        
        const { data: { session } } = await client.auth.getSession();
        
        if (session) {
          // Check if session is expired and refresh if needed
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            try {
              const { data: { session: refreshedSession }, error } = await client.auth.refreshSession();
              if (!error && refreshedSession) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else {
                setSession(null);
                setUser(null);
              }
            } catch (refreshError) {
              // Silent refresh failure, don't show error to user
              setSession(null);
              setUser(null);
            }
          } else {
            setSession(session);
            setUser(session.user);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        // Silent error handling
        setSession(null);
        setUser(null);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up periodic session refresh (every 5 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        const client = getSupabase();
        if (!client) return;
        
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = (session.expires_at || 0) - now;
          
          // Refresh if session expires in less than 10 minutes
          if (timeUntilExpiry < 600) {
            const { data: { session: refreshedSession }, error } = await client.auth.refreshSession();
            if (!error && refreshedSession) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
            }
          }
        }
      } catch (error) {
        // Silent refresh failure
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Listen for auth changes
    const client = getSupabase();
    if (!client) return;
    
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      try {
        if (event === 'TOKEN_REFRESHED') {
          // Silent token refresh, don't log to console
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      } catch (error) {
        // Silent error handling
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      try {
        subscription.unsubscribe();
        clearInterval(refreshInterval);
      } catch (error) {
        // Silent cleanup
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const client = getSupabase();
      if (!client) return { error: new Error('Authentication not available') };
      
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      }) || { error: new Error('Authentication not available') };
      return { error };
    } catch (error) {
      console.warn('Error during sign in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const client = getSupabase();
      if (!client) return { error: new Error('Authentication not available') };
      
      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      }) || { error: new Error('Authentication not available') };
      return { error };
    } catch (error) {
      console.warn('Error during sign up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const client = getSupabase();
      if (client) {
        await client.auth.signOut();
      }
      // Clear local state immediately
      setUser(null);
      setSession(null);
    } catch (error) {
      console.warn('Error signing out, clearing local state:', error);
      // Clear local state even if sign out fails
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const client = getSupabase();
      if (!client) return { error: new Error('Authentication not available') };
      
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window?.location?.origin || ''}/auth/reset-password`,
      }) || { error: new Error('Authentication not available') };
      return { error };
    } catch (error) {
      console.warn('Error during password reset:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
