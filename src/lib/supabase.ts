import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    // Log configuration for debugging (remove in production)
    if (typeof window !== 'undefined') {
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase client initialized');
    }
    
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Recommended for web apps
        debug: false, // Disable debug to reduce console noise
      },
    });
  }
  return supabaseInstance;
})();

// Force refresh to pick up new types
export const refreshSupabaseTypes = () => {
  supabaseInstance = null;
  return supabase;
};

// Function to refresh the Supabase client (useful after schema changes)
export const refreshSupabaseClient = () => {
  console.log('Refreshing Supabase client and schema cache...');
  supabaseInstance = null;
  return supabase; // This will create a new instance
};

