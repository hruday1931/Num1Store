import { supabaseClient } from './supabase/client';

export async function debugClientAuth() {
  console.log('=== Client-side Auth Debug ===');
  
  try {
    const supabase = supabaseClient();
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Client Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email,
      sessionError: sessionError?.message
    });
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Client User:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      userError: userError?.message
    });
    
    // Check current session
    const currentSession = supabase.auth.getSession();
    console.log('Current Session Promise:', currentSession);
    
    return {
      session,
      user,
      sessionError,
      userError
    };
    
  } catch (error) {
    console.error('Client Auth Debug Error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function checkServerAuth() {
  console.log('=== Server-side Auth Debug ===');
  
  try {
    const response = await fetch('/api/debug-auth', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Server Auth Response:', data);
    
    return data;
    
  } catch (error) {
    console.error('Server Auth Debug Error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
