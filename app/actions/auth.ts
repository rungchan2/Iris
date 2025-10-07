// app/actions/auth.ts
'use server'

import { unstable_cache } from 'next/cache'
import { setUserCookie, clearUserCookie } from '@/lib/auth/cookie'
import { createClient } from '@/lib/supabase/server'
import { authLogger } from '@/lib/logger'

/**
 * 현재 사용자 조회 (캐시 + 쿠키 업데이트)
 */
export const getCurrentUser = unstable_cache(
  async () => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      await clearUserCookie()
      return null
    }

    // DB에서 전체 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name, role, phone')
      .eq('id', user.id)
      .single()

    if (!userData) {
      authLogger.warn('User not found in database', { userId: user.id })
      return null
    }

    // 사진작가면 추가 정보
    let photographerData = null
    if (userData.role === 'photographer') {
      const { data } = await supabase
        .from('photographers')
        .select('approval_status, profile_image_url')
        .eq('id', user.id)
        .single()

      photographerData = data
    }

    const completeUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone || undefined,
      approvalStatus: photographerData?.approval_status,
      profileImageUrl: photographerData?.profile_image_url,
    }

    // 쿠키 업데이트 (최신 정보 동기화)
    await setUserCookie({
      id: completeUser.id,
      email: completeUser.email,
      name: completeUser.name,
      phone: completeUser.phone,
      role: completeUser.role as 'user' | 'photographer' | 'admin',
      approvalStatus: completeUser.approvalStatus,
      profileImageUrl: completeUser.profileImageUrl || undefined,
    })

    authLogger.info('User retrieved and cookie updated', { userId: completeUser.id })

    return completeUser
  },
  ['current-user'],
  { revalidate: 300, tags: ['user'] }
)

/**
 * 로그아웃
 */
export async function logout() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    authLogger.info('User logged out', { userId: user.id })
  }

  await supabase.auth.signOut()
  await clearUserCookie()
}

/**
 * 프로필 업데이트 (쿠키도 함께 업데이트)
 */
export async function updateProfile(updates: { name?: string; phone?: string }) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({
      name: updates.name,
      phone: updates.phone,
    })
    .eq('id', user.id)

  if (error) {
    authLogger.error('Profile update failed', { userId: user.id, error })
    throw error
  }

  authLogger.info('Profile updated', { userId: user.id })

  // 캐시 무효화
  const { revalidateTag } = await import('next/cache')
  revalidateTag('user')

  // 최신 정보 반환 (자동으로 쿠키 업데이트됨)
  return await getCurrentUser()
}

/**
 * 프로필 완성 (신규 사용자용)
 */
export async function completeProfile(userId: string, data: { name: string; phone: string }) {
  const supabase = await createClient()

  // Get email from Supabase auth
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    authLogger.error('No auth user found', { userId })
    return {
      success: false,
      error: '인증 정보를 찾을 수 없습니다',
    }
  }

  // UPSERT: Insert if not exists, update if exists
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: authUser.email!,
      name: data.name,
      phone: data.phone,
      role: 'user',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })

  if (upsertError) {
    authLogger.error('Profile completion failed', { userId, error: upsertError })
    return {
      success: false,
      error: upsertError.message || '프로필 업데이트에 실패했습니다',
    }
  }

  // Get updated user info
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, name, role, phone')
    .eq('id', userId)
    .single()

  if (!userData) {
    authLogger.error('User not found after profile update', { userId })
    return {
      success: false,
      error: '사용자 정보를 찾을 수 없습니다',
    }
  }

  // Update cookie with new phone info
  await setUserCookie({
    id: userData.id,
    email: userData.email,
    name: userData.name,
    phone: userData.phone,
    role: userData.role as 'user' | 'photographer' | 'admin',
  })

  authLogger.info('Profile completed successfully', { userId })

  return {
    success: true,
    data: userData,
  }
}

/**
 * 회원가입
 */
export async function signUpNewUser(
  email: string,
  password: string,
  name: string,
  role: 'user' | 'photographer' | 'admin' = 'user'
) {
  const supabase = await createClient()

  // Supabase Auth 회원가입
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        user_type: role,
      },
    },
  })

  if (authError || !authData.user) {
    authLogger.error('Signup failed', { email, error: authError })
    return {
      success: false,
      error: authError?.message || '회원가입에 실패했습니다.',
      data: null,
    }
  }

  authLogger.info('User signed up successfully', { userId: authData.user.id, role })

  return {
    success: true,
    data: authData,
    error: null,
  }
}

/**
 * 로그인 (역할 기반)
 */
export async function loginWithRole(email: string, password: string) {
  const supabase = await createClient()

  // 로그인 시도
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    authLogger.error('Login failed', { email, error: authError })
    return {
      success: false,
      error: authError?.message || 'Login failed',
      redirectPath: null,
    }
  }

  try {
    const user = authData.user

    // users 테이블에서 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name, role, phone')
      .eq('id', user.id)
      .single()

    if (!userData) {
      authLogger.error('User not found in database', { userId: user.id })
      return {
        success: false,
        error: '등록되지 않은 사용자입니다.',
        redirectPath: null,
      }
    }

    // 사진작가인 경우 추가 정보 조회
    let photographerData = null
    let redirectPath = '/'

    if (userData.role === 'photographer') {
      const { data } = await supabase
        .from('photographers')
        .select('approval_status, profile_image_url')
        .eq('id', user.id)
        .single()

      photographerData = data

      // 승인 상태에 따라 리다이렉트
      redirectPath =
        photographerData?.approval_status === 'approved'
          ? '/photographer-admin'
          : '/photographer/approval-status'
    } else if (userData.role === 'admin') {
      redirectPath = '/admin'
    }

    // 쿠키 설정
    await setUserCookie({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: userData.role as 'user' | 'photographer' | 'admin',
      approvalStatus: photographerData?.approval_status,
      profileImageUrl: photographerData?.profile_image_url || undefined,
    })

    authLogger.info('User logged in successfully', { userId: userData.id, role: userData.role })

    return {
      success: true,
      user: userData,
      redirectPath,
    }
  } catch (error) {
    authLogger.error('Login error', { error })
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다.',
      redirectPath: null,
    }
  }
}

/**
 * Simple login (without role-based redirect)
 */
export async function login(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    authLogger.error('Simple login failed', { email, error })
  } else if (data.user) {
    authLogger.info('Simple login successful', { userId: data.user.id })
  }

  return { data, error }
}
