// lib/auth/client-cookie.ts
'use client'

import { jwtVerify } from 'jose'
import type { UserCookie } from './cookie'

const COOKIE_NAME = 'kindt-user'
const SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET_KEY!)

/**
 * 브라우저에서 쿠키 읽기
 */
export async function getUserFromBrowserCookie(): Promise<UserCookie | null> {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const userCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`))

  if (!userCookie) return null

  const token = userCookie.split('=')[1]

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as UserCookie
  } catch {
    return null
  }
}
