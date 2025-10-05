import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
        .select('phone, role')
        .eq('id', data.session.user.id)
        .single()

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