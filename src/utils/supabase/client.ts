import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

// Singleton pattern to prevent multiple instances and auth locks
let supabaseClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabaseClient = () => {
  if (!supabaseClientInstance) {
    // Get environment variables at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Validate environment variables before creating client
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase environment variables are missing. Please check your .env.local file:\n' +
        '- NEXT_PUBLIC_SUPABASE_URL\n' +
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }
    
    supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false, // Disable debug to reduce console noise
      },
    });
  }
  return supabaseClientInstance;
};
