// app/providers/UserProvider.tsx
'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { getUserFromBrowserCookie } from '@/lib/auth/client-cookie'
import type { UserCookie } from '@/lib/auth/cookie'

export function UserProvider({
  children,
  serverUser,
}: {
  children: React.ReactNode
  serverUser: UserCookie | null
}) {
  const setUser = useUserStore(state => state.setUser)

  useEffect(() => {
    // 우선순위 1: 서버에서 전달된 유저
    if (serverUser) {
      setUser(serverUser)
      return
    }

    // 우선순위 2: 브라우저 쿠키에서 읽기
    getUserFromBrowserCookie().then(setUser)
  }, [serverUser, setUser])

  return <>{children}</>
}
