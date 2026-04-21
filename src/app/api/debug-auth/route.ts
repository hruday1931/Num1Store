import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug Auth: Starting authentication check...');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Debug Auth: Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    });
    
    // Get user directly
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('Debug Auth: User result:', {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message
    });
    
    // Check cookies
    const cookies = request.cookies.getAll();
    console.log('Debug Auth: Available cookies:', cookies.map(c => c.name));
    
    return NextResponse.json({
      success: true,
      session: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        sessionError: sessionError?.message
      },
      user: {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        userError: userError?.message
      },
      cookies: cookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })),
      headers: {
        cookie: request.headers.get('cookie')?.substring(0, 100) + '...'
      }
    });
    
  } catch (error) {
    console.error('Debug Auth Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
