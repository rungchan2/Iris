"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { UserProvider } from './providers/UserProvider'
import type { UserCookie } from '@/lib/auth/cookie'

export default function Providers({
  children,
  serverUser,
}: {
  children: React.ReactNode
  serverUser?: UserCookie | null
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider serverUser={serverUser || null}>
        {children}
      </UserProvider>
    </QueryClientProvider>
  )
}