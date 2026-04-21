import { createMiddlewareClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client with the request cookies
  const supabase = createMiddlewareClient(request)
  
  // Get session from the request
  const { data: { session } } = await supabase.auth.getSession()
  
  // Debug session in middleware
  console.log('Middleware: Session check for', request.nextUrl.pathname, session ? 'Session found' : 'No session')
  
  const { pathname } = request.nextUrl

  // If user is not signed in and trying to access protected routes
  if (!session) {
    // Allow access to public routes
    if (pathname.startsWith('/auth') || 
        pathname === '/' || 
        pathname.startsWith('/products') ||
        pathname.startsWith('/wishlist') ||
        pathname.startsWith('/cart') ||
        pathname.startsWith('/checkout') ||  // Allow guest checkout
        pathname.startsWith('/payment') ||   // Allow guest payment
        pathname.startsWith('/orders') ||   // Allow access to orders
        pathname.startsWith('/profile') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/vendor') ||  // Let vendor pages handle their own auth
        pathname.startsWith('/about') ||   // Public About Us page
        pathname.startsWith('/contact') || // Public Contact page
        pathname.startsWith('/faq') ||     // Public FAQ page
        pathname.startsWith('/privacy') ||  // Public Privacy Policy
        pathname.startsWith('/terms') ||    // Public Terms of Service
        pathname.startsWith('/refund') ||   // Public Refund Policy
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico')) {
      return NextResponse.next()
    }
    
    // Redirect to sign in for protected routes
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // If user is signed in, prevent access to auth pages
  if (pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // For vendor routes, let the pages handle their own authentication logic
  // This prevents middleware conflicts with the detailed auth checks in vendor pages
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
