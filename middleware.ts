import { createMiddlewareClient } from './src/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // DEBUG: Log every path check
  console.log('Middleware checking path:', pathname)
  
  // Create a Supabase client with the request cookies
  const supabase = createMiddlewareClient(request)
  
  // Get session from the request
  const { data: { session } } = await supabase.auth.getSession()
  
  // DEBUG: Log session status
  console.log('Middleware: Session check for', pathname, session ? 'Session found' : 'No session')

  // Explicitly ignore public routes - NO AUTHENTICATION CHECKS
  const publicRoutes = [
    '/',
    '/auth',
    '/products',
    '/search',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/refund',
    '/api',
    '/_next',
    '/favicon.ico',
    '/public'
  ]

  // Check if current path starts with any public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    console.log('Middleware: Public route allowed -', pathname)
    return NextResponse.next()
  }

  // If user is not signed in and trying to access protected routes
  if (!session) {
    console.log('Middleware: No session - redirecting to signin for', pathname)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // If user is signed in, prevent access to auth pages
  if (pathname.startsWith('/auth')) {
    console.log('Middleware: Signed in user accessing auth page - redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow access to all other routes for authenticated users
  console.log('Middleware: Authenticated user allowed -', pathname)
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
