import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  console.log('=== TEST CHECKOUT API ===');
  
  try {
    const { amount, currency } = await request.json();
    console.log('Test checkout request:', { amount, currency });

    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No auth token' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    console.log('Token length:', token.length);
    
    // Test Supabase connection
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('User data:', user);
    console.log('Auth error:', authError);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Test cart query
    const { data: cartItems, error: cartError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('Cart items:', cartItems);
    console.log('Cart error:', cartError);
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      cartItems: cartItems || [],
      cartCount: cartItems?.length || 0
    });
    
  } catch (error) {
    console.error('Test checkout error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
