import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserFromCookie } from '@/lib/auth/cookie'

export async function middleware(request: NextRequest) {
  const middlewareStartTime = performance.now()

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // Public routes
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth',
    '/profile/complete',
    '/api',
    '/_next',
    '/favicon.ico',
    '/matching',
    '/photographers',
    '/reset-password',
    '/review',
    '/payment',
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get user from cookie
  const cookieStartTime = performance.now()
  const user = await getUserFromCookie(request)
  const cookieDuration = performance.now() - cookieStartTime
  console.log(`[Middleware Performance] Cookie parsing: ${cookieDuration.toFixed(2)}ms`)

  // Profile completion check (for regular users only)
  if (user && user.role === 'user' && !user.phone && pathname !== '/profile/complete') {
    // Exclude public routes from profile completion check
    if (!isPublicRoute) {
      console.log('[Middleware] User profile incomplete, redirecting to /profile/complete')
      url.pathname = '/profile/complete'
      return NextResponse.redirect(url)
    }
  }

  // If user is logged in and tries to access login/signup, redirect to appropriate page
  if (user && (pathname === '/login' || pathname === '/signup')) {
    if (user.role === 'admin') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    } else if (user.role === 'photographer') {
      // Check approval status from cookie
      url.pathname = user.approvalStatus === 'approved'
        ? '/photographer-admin'
        : '/photographer/approval-status'
      return NextResponse.redirect(url)
    } else {
      // Regular user - redirect to home
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Routes requiring authentication
  const authRequired =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/photographer-admin') ||
    pathname.startsWith('/booking')

  // Redirect to login if auth required but no user
  if (authRequired && !user) {
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Role-based access control
  if (user) {
    // Admin routes - only admin role
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Photographer admin routes - only photographer role
    if (pathname.startsWith('/photographer-admin')) {
      if (user.role !== 'photographer') {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Pending photographers can only access specific pages
      if (user.approvalStatus === 'pending') {
        const allowedPendingRoutes = [
          '/photographer-admin/my-page',
          '/photographer/approval-status',
        ]

        const isAllowedPendingRoute = allowedPendingRoutes.some(route =>
          pathname.startsWith(route)
        )

        if (!isAllowedPendingRoute) {
          url.pathname = '/photographer/approval-status'
          return NextResponse.redirect(url)
        }
      }
    }

  }

  const middlewareDuration = performance.now() - middlewareStartTime
  console.log(`[Middleware Performance] Total middleware: ${middlewareDuration.toFixed(2)}ms for ${pathname}`)

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
