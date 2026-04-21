import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  
  try {
    // Skip middleware processing for server actions and API routes
    const { pathname } = request.nextUrl
    
    // Check if this is a server action or API route
    if (pathname.startsWith('/api/') || 
        request.headers.get('content-type')?.includes('multipart/form-data') ||
        request.method === 'POST' && pathname.includes('actions')) {
      // Let server actions and API routes handle their own authentication
      return response
    }
    
    // Create Supabase client for middleware with proper cookie handling
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: (() => {
            const cookieHeader = request.headers.get('cookie');
            return cookieHeader ? { cookie: cookieHeader } : undefined;
          })(),
        },
        auth: {
          persistSession: false,
        },
      }
    )
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    
    // Define protected routes - only restrict admin and seller dashboards
    const protectedRoutes = ['/admin', '/seller']
    const authRoutes = ['/auth/signin', '/auth/signup']
    
    // Check if user is accessing a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    
    // Redirect logic - only redirect for admin/seller routes
    if (!session && isProtectedRoute) {
      // User is not authenticated and trying to access protected route
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    if (session && isAuthRoute) {
      // User is authenticated and trying to access auth page
      // Redirect to appropriate dashboard based on user role
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()
        
        const { data: vendor } = await supabase
          .from('vendors')
          .select('is_approved')
          .eq('user_id', session.user.id)
          .single()
        
        if (vendor?.is_approved) {
          return NextResponse.redirect(new URL('/seller', request.url))
        } else if (vendor) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } catch (error) {
        // If we can't determine role, redirect to home
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    
    // Handle root redirect for authenticated users
    if (session && pathname === '/') {
      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('is_approved')
          .eq('user_id', session.user.id)
          .single()
        
        if (vendor?.is_approved) {
          return NextResponse.redirect(new URL('/seller', request.url))
        } else if (vendor) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        // If no vendor record, stay on home page
      } catch (error) {
        // Stay on home page if there's an error
      }
    }
    
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without redirecting if there's an error
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
