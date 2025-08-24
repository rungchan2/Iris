'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface SignupWithInviteParams {
  email: string
  password: string
  name: string
  inviteCode: string
}

interface CreateInviteCodeParams {
  expiresInDays: number
  notes?: string
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

export async function signupWithInviteCode(params: SignupWithInviteParams) {
  try {
    const { email, password, name, inviteCode } = params
    
    // 1. 초대 코드 검증
    const { data: inviteData, error: inviteError } = await supabaseService
      .from('admin_invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !inviteData) {
      return { error: '유효하지 않거나 만료된 초대 코드입니다.' }
    }

    // 2. 이메일 중복 확인 (auth.users와 admins 테이블 모두 확인)
    const { data: existingAuthUser } = await supabaseService.auth.admin.listUsers()
    const emailExists = existingAuthUser.users.some(user => user.email === email)
    
    if (emailExists) {
      return { error: '이미 가입된 이메일입니다.' }
    }

    // 3. Auth 사용자 생성 (service role 사용)
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 자동으로 이메일 확인됨으로 설정
      user_metadata: {
        name,
        user_type: 'admin' // admin 타입으로 설정
      }
    })

    if (authError || !authData.user) {
      return { error: '회원가입 중 오류가 발생했습니다: ' + authError?.message }
    }

    // 4. Admin은 auth.users에만 저장됨 (새 시스템에서는 별도 테이블 불필요)

    // 5. 초대 코드 사용 처리
    const { error: codeUpdateError } = await supabaseService
      .from('admin_invite_codes')
      .update({
        used_by: authData.user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', inviteData.id)

    if (codeUpdateError) {
      console.error('초대 코드 업데이트 오류:', codeUpdateError)
    }

    return { 
      success: true, 
      message: '회원가입이 완료되었습니다. 로그인 페이지로 이동해주세요.',
      user: {
        id: authData.user.id,
        email,
        name,
        user_type: 'admin'
      }
    }

  } catch (error) {
    console.error('Signup error:', error)
    return { error: '회원가입 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function createInviteCode(params: CreateInviteCodeParams) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자가 인증되었는지 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: '로그인이 필요합니다.' }
    }

    // Admin 권한 확인
    const isAdmin = user.user_metadata?.user_type === 'admin'
    if (!isAdmin) {
      return { error: '초대 코드 생성 권한이 없습니다.' }
    }

    // 랜덤 코드 생성 (12자리)
    const code = Math.random().toString(36).substring(2, 14).toUpperCase()
    
    // 만료일 계산
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + params.expiresInDays)

    const { data, error } = await supabase
      .from('admin_invite_codes')
      .insert({
        code,
        expires_at: expiresAt.toISOString(),
        notes: params.notes,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      return { error: '초대 코드 생성 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/invites')
    
    return { 
      success: true, 
      data: {
        ...data,
        code // 코드를 응답에 포함
      }
    }

  } catch (error) {
    console.error('Create invite code error:', error)
    return { error: '초대 코드 생성 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function getInviteCodes() {
  try {
    const supabase = await createClient()
    
    // 현재 사용자가 인증되었는지 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: '로그인이 필요합니다.' }
    }

    // Admin 권한 확인
    const isAdmin = user.user_metadata?.user_type === 'admin'
    if (!isAdmin) {
      return { error: '초대 코드 조회 권한이 없습니다.' }
    }

    const { data, error } = await supabase
      .from('admin_invite_codes')
      .select(`
        *
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: '초대 코드 조회 중 오류가 발생했습니다.' }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Get invite codes error:', error)
    return { error: '초대 코드 조회 중 예상치 못한 오류가 발생했습니다.' }
  }
}

export async function validateInviteCode(code: string) {
  try {
    const { data, error } = await supabaseService
      .from('admin_invite_codes')
      .select('expires_at, used_at')
      .eq('code', code)
      .single()

    if (error || !data) {
      return { valid: false, message: '존재하지 않는 초대 코드입니다.' }
    }

    if (data.used_at) {
      return { valid: false, message: '이미 사용된 초대 코드입니다.' }
    }

    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, message: '만료된 초대 코드입니다.' }
    }

    return { 
      valid: true,
      message: '유효한 초대 코드입니다.' 
    }

  } catch (error) {
    console.error('Validate invite code error:', error)
    return { valid: false, message: '초대 코드 검증 중 오류가 발생했습니다.' }
  }
}