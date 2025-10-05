// stores/useUserStore.ts
'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserCookie } from '@/lib/auth/cookie'

interface UserStore {
  user: UserCookie | null
  isHydrated: boolean

  setUser: (user: UserCookie | null) => void
  clearUser: () => void

  // 편의 함수
  isAdmin: () => boolean
  isPhotographer: () => boolean
  isApprovedPhotographer: () => boolean
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      user: null,
      isHydrated: false,

      setUser: (user) => {
        set({ user, isHydrated: true })
      },

      clearUser: () => {
        set({ user: null })
      },

      isAdmin: () => get().user?.role === 'admin',

      isPhotographer: () => get().user?.role === 'photographer',

      isApprovedPhotographer: () => {
        const user = get().user
        return user?.role === 'photographer' && user.approvalStatus === 'approved'
      },
    }),
    { name: 'UserStore' }
  )
)
