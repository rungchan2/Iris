import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = request.nextUrl.clone()

  // Public routes that don't require profile completion
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth/callback',
    '/profile/complete',
    '/api',
    '/_next',
    '/favicon.ico',
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))

  // If logged in and not on a public route, check profile completion
  if (session && !isPublicRoute) {
    // Get user profile
    const { data: userData } = await supabase
      .from('users')
      .select('phone, role')
      .eq('id', session.user.id)
      .single()

    // Profile incomplete - redirect to profile completion
    // Only for regular users (not photographers or admins)
    if (!userData?.phone && userData?.role === 'user') {
      url.pathname = '/profile/complete'
      return NextResponse.redirect(url)
    }
  }

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
