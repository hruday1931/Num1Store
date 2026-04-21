import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Singleton pattern to prevent multiple instances and auth locks
let supabaseClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabaseClient = () => {
  if (!supabaseClientInstance) {
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
