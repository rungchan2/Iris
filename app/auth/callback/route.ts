import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { setUserCookie } from '@/lib/auth/cookie'
import { authLogger } from '@/lib/logger'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Check if user profile is complete
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, name, phone, role')
        .eq('id', data.session.user.id)
        .single()

      if (userData) {
        // Get photographer info if applicable
        let photographerData = null
        if (userData.role === 'photographer') {
          const { data } = await supabase
            .from('photographers')
            .select('approval_status, profile_image_url')
            .eq('id', userData.id)
            .single()

          photographerData = data
        }

        // Set user cookie for new auth system
        try {
          await setUserCookie({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as 'user' | 'photographer' | 'admin',
            approvalStatus: photographerData?.approval_status,
            profileImageUrl: photographerData?.profile_image_url || undefined,
          })
          authLogger.info('User cookie set after OAuth login', { userId: userData.id })
        } catch (cookieError) {
          authLogger.error('Failed to set user cookie', { error: cookieError })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let finalRedirect = redirectTo ?? '/'

      // If profile is incomplete (no phone), redirect to profile completion
      // But skip for photographers and admins (they have their own flows)
      if (!userData?.phone && userData?.role === 'user') {
        finalRedirect = '/profile/complete'
      }

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${finalRedirect}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${finalRedirect}`)
      } else {
        return NextResponse.redirect(`${origin}${finalRedirect}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}