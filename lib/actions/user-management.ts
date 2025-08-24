'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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

// Service role client for admin operations
const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function createAdminUser(params: CreateAdminUserParams) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자가 인증되었는지 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { email, password, name } = params
    
    // Auth 사용자 생성 (service role 사용) - admin은 auth.users에만 저장
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        user_type: 'admin'
      }
    })

    if (authError || !authData.user) {
      return { error: '사용자 생성 중 오류가 발생했습니다: ' + authError?.message }
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
    
    // 이메일 중복 확인
    const { data: existingPhotographer } = await supabaseService
      .from('photographers')
      .select('id')
      .eq('email', email)
      .single()

    if (existingPhotographer) {
      return { error: '이미 사용 중인 이메일입니다.' }
    }

    // Auth 사용자 생성 (service role 사용)
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        user_type: 'photographer'
      }
    })

    if (authError || !authData.user) {
      return { error: '사용자 생성 중 오류가 발생했습니다: ' + authError?.message }
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
        created_at: new Date().toISOString(),
        approval_status: 'approved',
        profile_completed: true
      })

    if (photographerError) {
      // Auth 사용자 삭제 (롤백)
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

    // Admin 사용자는 auth.users에만 존재하므로 Service Role로 조회
    const { data, error } = await supabaseService.auth.admin.listUsers()
    
    if (error) {
      return { error: '관리자 목록 조회 중 오류가 발생했습니다.' }
    }

    // Admin 사용자만 필터링 (user_metadata.user_type이 'admin'인 사용자)
    const adminUsers = data.users
      .filter(user => user.user_metadata?.user_type === 'admin')
      .map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        role: 'admin',
        created_at: user.created_at,
        last_login_at: user.last_sign_in_at || null,
        is_active: !user.user_metadata?.banned_until
      }))

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

    const { data, error } = await supabase
      .from('photographers')
      .select('id, email, name, phone, website_url, instagram_handle, bio, created_at, approval_status')
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
    // 이미 Admin이 존재하는지 확인 (auth.users에서 user_type이 'admin'인 사용자)
    const { data: authUsers } = await supabaseService.auth.admin.listUsers()
    const existingAdmin = authUsers?.users.find(user => user.user_metadata?.user_type === 'admin')

    if (existingAdmin) {
      return { error: '이미 Admin이 존재합니다. 이 기능은 최초 설정시에만 사용할 수 있습니다.' }
    }

    const { email, password, name } = params
    
    // 이메일 중복 확인
    const existingUser = authUsers?.users.find(user => user.email === email)
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
        user_type: 'admin'
      }
    })

    if (authError || !authData.user) {
      return { error: '사용자 생성 중 오류가 발생했습니다: ' + authError?.message }
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
    const { data: authUsers } = await supabaseService.auth.admin.listUsers()
    const existingAdmin = authUsers?.users.find(user => user.user_metadata?.user_type === 'admin')

    return { exists: !!existingAdmin }
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

    // 이미 존재하는지 확인 (auth.users에서)
    const { data: existingUser } = await supabaseService.auth.admin.getUserById(specificUserId)
    if (existingUser.user) {
      return { error: '이미 해당 Admin이 존재합니다.' }
    }

    // 이메일 중복 확인
    const { data: authUsers } = await supabaseService.auth.admin.listUsers()
    const existingEmailUser = authUsers?.users.find(user => user.email === specificEmail)
    if (existingEmailUser) {
      return { error: '이미 해당 이메일이 사용 중입니다.' }
    }

    // 해당 사용자가 이미 존재한다면 user_metadata만 업데이트
    const { error: updateError } = await supabaseService.auth.admin.updateUserById(specificUserId, {
      user_metadata: {
        name: specificName,
        user_type: 'admin'
      }
    })

    if (updateError) {
      return { error: '사용자 정보 업데이트 중 오류가 발생했습니다: ' + updateError.message }
    }
    
    return { 
      success: true, 
      message: '특정 Admin이 성공적으로 설정되었습니다.',
      user: {
        id: specificUserId,
        email: specificEmail,
        name: specificName,
        role: 'admin'
      }
    }

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
    const { error: authError } = await supabaseService.auth.admin.deleteUser(userId)
    
    if (authError) {
      return { error: '사용자 삭제 중 오류가 발생했습니다.' }
    }

    // photographer의 경우 photographers 테이블에서도 명시적으로 삭제
    if (userType === 'photographer') {
      await supabaseService.from('photographers').delete().eq('id', userId)
    }
    // admin의 경우 auth.users에만 존재하므로 별도 삭제 불필요

    revalidatePath('/admin/users')
    
    return { success: true, message: '사용자가 성공적으로 삭제되었습니다.' }

  } catch (error) {
    console.error('Delete user error:', error)
    return { error: '사용자 삭제 중 예상치 못한 오류가 발생했습니다.' }
  }
}