'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateAdminUserParams {
  email: string
  password: string
  name: string
}

interface CreatePhotographerParams {
  email: string
  password: string
  name: string
  phone?: string
  website_url?: string
  instagram_handle?: string
  bio?: string
}

export async function createAdminUser(params: CreateAdminUserParams) {
  try {
    const supabase = await createClient()

    // 현재 사용자가 인증되었는지 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { email, password, name } = params

    // Auth 사용자 생성 (service role 사용)
    const supabaseService = createServiceRoleClient()
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'admin'
      }
    })

    if (authError || !authData.user) {
      return { error: '사용자 생성 중 오류가 발생했습니다: ' + authError?.message }
    }

    // users 테이블에 추가
    const { error: userError } = await supabaseService
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'admin'
      })

    if (userError) {
      // 롤백: Auth 사용자 삭제
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return { error: '사용자 정보 저장 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: '관리자 사용자가 성공적으로 생성되었습니다.',
      user: {
        id: authData.user.id,
        email,
        name
      }
    }

  } catch (error) {
    console.error('Create admin user error:', error)
    return { error: '사용자 생성 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function createPhotographerUser(params: CreatePhotographerParams) {
  try {
    const supabase = await createClient()

    // 현재 사용자가 인증되었는지 확인 (admin 사용자만)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { email, password, name, phone, website_url, instagram_handle, bio } = params

    const supabaseService = createServiceRoleClient()

    // 이메일 중복 확인
    const { data: existingUser } = await supabaseService
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { error: '이미 사용 중인 이메일입니다.' }
    }

    // Auth 사용자 생성 (service role 사용)
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'photographer'
      }
    })

    if (authError || !authData.user) {
      return { error: '사용자 생성 중 오류가 발생했습니다: ' + authError?.message }
    }

    // users 테이블에 추가
    const { error: userError } = await supabaseService
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role: 'photographer'
      })

    if (userError) {
      // 롤백: Auth 사용자 삭제
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return { error: '사용자 정보 저장 중 오류가 발생했습니다.' }
    }

    // photographers 테이블에 추가
    const { error: photographerError } = await supabaseService
      .from('photographers')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        website_url: website_url || null,
        instagram_handle: instagram_handle || null,
        bio: bio || null,
        approval_status: 'approved',
        profile_completed: true
      })

    if (photographerError) {
      // 롤백: users와 Auth 사용자 삭제
      await supabaseService.from('users').delete().eq('id', authData.user.id)
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return { error: '작가 정보 저장 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: '작가 사용자가 성공적으로 생성되었습니다.',
      user: {
        id: authData.user.id,
        email,
        name
      }
    }

  } catch (error) {
    console.error('Create photographer user error:', error)
    return { error: '사용자 생성 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function getAdminUsers() {
  try {
    const supabase = await createClient()

    // 현재 사용자가 인증되었는지 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    // users 테이블에서 role='admin'인 사용자 조회
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      return { error: '관리자 목록 조회 중 오류가 발생했습니다.' }
    }

    return { success: true, data: adminUsers }

  } catch (error) {
    console.error('Get admin users error:', error)
    return { error: '관리자 목록 조회 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function getPhotographerUsers() {
  try {
    const supabase = await createClient()

    // 현재 사용자가 인증되었는지 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    // users와 photographers 테이블 JOIN
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        photographers (
          website_url,
          instagram_handle,
          bio,
          approval_status,
          profile_completed
        )
      `)
      .eq('role', 'photographer')
      .order('created_at', { ascending: false })

    if (error) {
      return { error: '작가 목록 조회 중 오류가 발생했습니다.' }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Get photographer users error:', error)
    return { error: '작가 목록 조회 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function createInitialAdmin(params: { email: string; password: string; name: string }) {
  try {
    const supabaseService = createServiceRoleClient()

    // 이미 Admin이 존재하는지 확인
    const { data: existingAdmins } = await supabaseService
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return { error: '이미 Admin이 존재합니다. 이 기능은 최초 설정시에만 사용할 수 있습니다.' }
    }

    const { email, password, name } = params

    // 이메일 중복 확인
    const { data: existingUser } = await supabaseService
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { error: '이미 사용 중인 이메일입니다.' }
    }

    // Auth 사용자 생성 (service role 사용)
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'admin'
      }
    })

    if (authError || !authData.user) {
      return { error: '사용자 생성 중 오류가 발생했습니다: ' + authError?.message }
    }

    // users 테이블에 추가
    const { error: userError } = await supabaseService
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'admin'
      })

    if (userError) {
      // 롤백: Auth 사용자 삭제
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return { error: '사용자 정보 저장 중 오류가 발생했습니다.' }
    }

    return {
      success: true,
      message: '최초 Admin이 성공적으로 생성되었습니다. 이제 /login 페이지에서 로그인할 수 있습니다.',
      user: {
        id: authData.user.id,
        email,
        name,
        role: 'admin'
      }
    }

  } catch (error) {
    console.error('Create initial admin error:', error)
    return { error: 'Admin 생성 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function checkAdminExists() {
  try {
    const supabaseService = createServiceRoleClient()
    const { data: existingAdmins } = await supabaseService
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    return { exists: existingAdmins && existingAdmins.length > 0 }
  } catch (error) {
    console.error('Check admin exists error:', error)
    return { exists: false }
  }
}

export async function createSpecificAdmin() {
  try {
    const specificUserId = 'b6a15cf5-8a2d-4d34-b6c5-9f7ff6fc64c0'
    const specificEmail = 'leeh09077@gmail.com'
    const specificName = 'Lee Heechan'

    const supabaseService = createServiceRoleClient()

    // 이미 존재하는지 확인
    const { data: existingUser } = await supabaseService
      .from('users')
      .select('id, role')
      .eq('id', specificUserId)
      .single()

    if (existingUser) {
      // 이미 존재하면 role만 admin으로 업데이트
      const { error: updateError } = await supabaseService
        .from('users')
        .update({ role: 'admin' })
        .eq('id', specificUserId)

      if (updateError) {
        return { error: '사용자 역할 업데이트 중 오류가 발생했습니다: ' + updateError.message }
      }

      return {
        success: true,
        message: '특정 사용자가 Admin으로 설정되었습니다.',
        user: {
          id: specificUserId,
          email: specificEmail,
          name: specificName,
          role: 'admin'
        }
      }
    }

    // 존재하지 않으면 에러
    return { error: '해당 사용자가 존재하지 않습니다.' }

  } catch (error) {
    console.error('Create specific admin error:', error)
    return { error: 'Admin 설정 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function deleteUser(userId: string, userType: 'admin' | 'photographer') {
  try {
    const supabase = await createClient()

    // 현재 사용자가 인증되었는지 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    // Auth 사용자 삭제 (모든 관련 데이터는 CASCADE로 자동 삭제)
    const supabaseService = createServiceRoleClient()
    const { error: authError } = await supabaseService.auth.admin.deleteUser(userId)

    if (authError) {
      return { error: '사용자 삭제 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')

    return { success: true, message: '사용자가 성공적으로 삭제되었습니다.' }

  } catch (error) {
    console.error('Delete user error:', error)
    return { error: '사용자 삭제 중 예상치 못한 오류가 발생했습니다.' }
  }
}