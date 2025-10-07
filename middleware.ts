import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserFromCookie } from '@/lib/auth/cookie'
import { SignJWT } from 'jose'

export async function middleware(request: NextRequest) {
  const middlewareStartTime = performance.now()

  const { pathname } = request.nextUrl

  // CRITICAL: Skip profile completion page entirely to avoid redirect loops
  if (pathname === '/profile/complete' || pathname.startsWith('/profile/complete')) {
    console.log('[Middleware] Early exit for /profile/complete')
    const middlewareDuration = performance.now() - middlewareStartTime
    console.log(`[Middleware Performance] Total middleware: ${middlewareDuration.toFixed(2)}ms for ${pathname}`)
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request,
  })

  const url = request.nextUrl.clone()

  // Public routes
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth',
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

  // Create Supabase client to check session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user from cookie
  const cookieStartTime = performance.now()
  let user = await getUserFromCookie(request)
  const cookieDuration = performance.now() - cookieStartTime
  console.log(`[Middleware Performance] Cookie parsing: ${cookieDuration.toFixed(2)}ms`)

  // If no kindt-user cookie but Supabase session exists, sync it
  if (!user && !pathname.startsWith('/auth/callback')) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[Middleware] Error getting session:', sessionError)
    }

    if (session?.user) {
      console.log('[Middleware] Found Supabase session without kindt-user cookie, syncing...', {
        userId: session.user.id,
        email: session.user.email
      })

      // Fetch user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, phone, role')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('[Middleware] Error fetching user data:', userError)
      }

      if (!userData) {
        console.log('[Middleware] No user data found, redirecting to profile completion')
        url.pathname = '/profile/complete'
        return NextResponse.redirect(url)
      }

      if (userData) {
        console.log('[Middleware] User data fetched:', {
          id: userData.id,
          email: userData.email,
          role: userData.role
        })

        // Get photographer data if needed
        let photographerData = null
        if (userData.role === 'photographer') {
          const { data } = await supabase
            .from('photographers')
            .select('approval_status, profile_image_url')
            .eq('id', userData.id)
            .single()
          photographerData = data
        }

        // Set kindt-user cookie with JWT token
        const userCookie = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          approvalStatus: photographerData?.approval_status,
          profileImageUrl: photographerData?.profile_image_url,
        }

        console.log('[Middleware] Setting kindt-user cookie:', userCookie)

        // Create JWT token
        const SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)
        const token = await new SignJWT(userCookie)
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .sign(SECRET)

        console.log('[Middleware] JWT token generated, length:', token.length)

        response.cookies.set('kindt-user', token, {
          httpOnly: false, // Allow client-side reading
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })

        user = userCookie
        console.log('[Middleware] kindt-user cookie synced successfully')
      }
    }
  }

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
    pathname.startsWith('/photographer-admin')

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

  return response
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
