import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables only at runtime, not build time
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
}

// Create a server client with cookie context for authentication
export async function createClient() {
  // Validate environment variables before creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are missing. Please check your .env.local file:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  
  const cookieStore = await cookies();
  
  // Build cookie string properly
  const cookiesList = cookieStore.getAll();
  const cookieString = cookiesList.map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');
  
  // Debug: Log cookie information (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Server client - Cookie count:', cookiesList.length);
    console.log('Server client - Available cookies:', cookiesList.map((c: { name: string }) => c.name).join(', '));
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable session persistence for server actions
      autoRefreshToken: false, // Disable auto-refresh for server actions
      detectSessionInUrl: false, // Server-side doesn't need URL detection
      flowType: 'pkce', // Match client-side flow type
    },
    global: {
      headers: {
        cookie: cookieString,
      },
    },
  });
}

// For middleware usage (with request cookies)
export const createMiddlewareClient = (request?: NextRequest) => {
  // Validate environment variables before creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are missing. Please check your .env.local file:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  
  let cookieString = '';
  
  if (request?.cookies) {
    // For NextRequest, convert cookies to string format
    const cookies: string[] = [];
    request.cookies.getAll().forEach((cookie: { name: string; value: string }) => {
      cookies.push(`${cookie.name}=${cookie.value}`);
    });
    cookieString = cookies.join('; ');
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Enable session persistence for middleware
      autoRefreshToken: true, // Enable auto-refresh for middleware
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieString,
      },
    },
  });
};

// Create service role client for bypassing RLS (for admin operations)
export const createServiceRoleClient = () => {
  // Validate environment variables before creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are missing. Please check your .env.local file:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key for service operations');
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
