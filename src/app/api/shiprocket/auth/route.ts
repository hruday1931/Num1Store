import { NextRequest, NextResponse } from 'next/server';

// Shiprocket API endpoints
const SHIPROCKET_AUTH_URL = 'https://apiv2.shiprocket.in/v1/external/auth/login';

export async function POST() {
  try {
    // Get credentials from environment variables
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    // Validate credentials
    if (!email || !password) {
      console.error('Shiprocket credentials missing:', {
        hasEmail: !!email,
        hasPassword: !!password
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Shiprocket credentials not configured' 
        },
        { status: 500 }
      );
    }

    // Make request to Shiprocket auth API
    const authResponse = await fetch(SHIPROCKET_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.text();
      console.error('Shiprocket auth failed:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        response: errorData
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Shiprocket authentication failed',
          details: `HTTP ${authResponse.status}: ${authResponse.statusText}`
        },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    
    if (!authData.token) {
      console.error('Shiprocket auth response missing token:', authData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authentication response from Shiprocket' 
        },
        { status: 500 }
      );
    }

    console.log('Shiprocket authentication successful');
    
    return NextResponse.json({
      success: true,
      token: authData.token,
      // Don't expose the full response, just what we need
      expiresAt: authData.expires_at || null
    });

  } catch (error) {
    console.error('Shiprocket auth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to authenticate with Shiprocket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if credentials are configured (for frontend validation)
export async function GET() {
  const hasEmail = !!process.env.SHIPROCKET_EMAIL;
  const hasPassword = !!process.env.SHIPROCKET_PASSWORD;
  
  return NextResponse.json({
    configured: hasEmail && hasPassword,
    hasEmail,
    hasPassword
  });
}
