import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test Auth: Starting authentication test...');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Test 1: getSession()
    console.log('Test Auth: Testing getSession()...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Test 2: getUser()
    console.log('Test Auth: Testing getUser()...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Test 3: Check cookies
    const cookies = request.cookies.getAll();
    console.log('Test Auth: Available cookies:', cookies.length);
    
    const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('supabase'));
    console.log('Test Auth: Auth cookie found:', !!authCookie);
    
    return NextResponse.json({
      success: true,
      tests: {
        getSession: {
          success: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: sessionError?.message
        },
        getUser: {
          success: !!user,
          userId: user?.id,
          error: userError?.message
        },
        cookies: {
          count: cookies.length,
          hasAuthCookie: !!authCookie,
          cookieNames: cookies.map(c => c.name)
        }
      }
    });
    
  } catch (error) {
    console.error('Test Auth Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
