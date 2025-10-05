// lib/auth/cookie.ts
'use server'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'kindt-user'
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)
const MAX_AGE = 60 * 60 * 24 * 7 // 7일

export interface UserCookie {
  id: string
  email: string
  name: string | null
  role: 'user' | 'photographer' | 'admin'
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  profileImageUrl?: string
  [key: string]: unknown // JWT payload compatibility
}

// === 서버 컴포넌트용 ===

/**
 * 쿠키 저장 (로그인/프로필 업데이트 시)
 */
export async function setUserCookie(user: UserCookie) {
  console.log('[Auth] Setting user cookie:', user)

  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)

  console.log('[Auth] JWT token generated, length:', token.length)

  const cookieStore = await cookies()
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: false, // 클라이언트에서도 읽기 가능
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  console.log('[Auth] Cookie set successfully')
}

/**
 * 쿠키 읽기 (서버 컴포넌트)
 */
export async function getUserCookie(): Promise<UserCookie | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as UserCookie
  } catch {
    return null
  }
}

/**
 * 쿠키 삭제 (로그아웃)
 */
export async function clearUserCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// === Middleware용 ===

/**
 * Next.js Request 객체에서 쿠키 읽기
 */
export async function getUserFromCookie(
  request: NextRequest
): Promise<UserCookie | null> {
  const startTime = performance.now()

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    console.log(`[Auth] No '${COOKIE_NAME}' cookie found in request`)
    return null
  }

  try {
    const verifyStartTime = performance.now()
    const { payload } = await jwtVerify(token, SECRET)
    const verifyDuration = performance.now() - verifyStartTime

    const totalDuration = performance.now() - startTime
    console.log('[Auth] Successfully verified JWT cookie:', payload)
    console.log(`[Auth Performance] JWT verify: ${verifyDuration.toFixed(2)}ms, Total: ${totalDuration.toFixed(2)}ms`)

    return payload as unknown as UserCookie
  } catch (error) {
    const totalDuration = performance.now() - startTime
    console.error('[Auth] Failed to verify JWT cookie:', error)
    console.log(`[Auth Performance] Failed verification after ${totalDuration.toFixed(2)}ms`)
    return null
  }
}
