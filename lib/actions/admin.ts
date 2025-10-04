'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

type User = Tables<'users'>
type UserInsert = TablesInsert<'users'>
type UserUpdate = TablesUpdate<'users'>

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

/**
 * Get current admin profile
 */
export async function getCurrentAdmin() {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    // Get user from users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !user) {
      return { error: '사용자 정보 조회 실패: ' + (error?.message || 'User not found') }
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return { error: '관리자 권한이 없습니다.' }
    }

    return { data: user }
  } catch (error) {
    console.error('Get current admin error:', error)
    return { error: '예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(data: Partial<UserUpdate>) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    // Don't allow role change through this function
    const updateData = { ...data }
    delete (updateData as any).role

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      return { error: '프로필 업데이트 실패: ' + error.message }
    }

    revalidatePath('/admin/my-page')

    return {
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      data: updatedUser
    }
  } catch (error) {
    console.error('Update admin profile error:', error)
    return { error: '프로필 업데이트 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Create new admin user (Admin only)
 */
export async function createAdmin(params: {
  email: string
  password: string
  name: string
  phone?: string
}) {
  try {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return { error: '관리자 권한이 필요합니다.' }
    }

    const { email, password, name, phone } = params

    // Create Auth user
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

    // Create user record with role='admin'
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'admin',
        phone
      })
      .select()
      .single()

    if (userError) {
      // Rollback auth user creation
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return { error: '사용자 정보 저장 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: '관리자가 성공적으로 생성되었습니다.',
      data: userData
    }
  } catch (error) {
    console.error('Create admin error:', error)
    return { error: '관리자 생성 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Get all admins (Admin only)
 */
export async function getAllAdmins() {
  try {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return { error: '관리자 권한이 필요합니다.' }
    }

    const { data: admins, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      return { error: '관리자 목록 조회 중 오류가 발생했습니다.' }
    }

    return { success: true, data: admins }
  } catch (error) {
    console.error('Get all admins error:', error)
    return { error: '관리자 목록 조회 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Update admin (Admin only)
 */
export async function updateAdmin(adminId: string, data: Partial<UserUpdate>) {
  try {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return { error: '관리자 권한이 필요합니다.' }
    }

    // Don't allow role change through this function
    const updateData = { ...data }
    delete (updateData as any).role

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single()

    if (error) {
      return { error: '사용자 정보 업데이트 실패: ' + error.message }
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      data: updatedUser
    }
  } catch (error) {
    console.error('Update admin error:', error)
    return { error: '사용자 정보 업데이트 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Delete admin (Admin only)
 */
export async function deleteAdmin(adminId: string) {
  try {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return { error: '관리자 권한이 필요합니다.' }
    }

    // Prevent deleting self
    if (adminId === session.user.id) {
      return { error: '자신의 계정은 삭제할 수 없습니다.' }
    }

    // Delete auth user (this will cascade delete user record)
    const { error: authError } = await supabaseService.auth.admin.deleteUser(adminId)

    if (authError) {
      return { error: '사용자 삭제 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.'
    }
  } catch (error) {
    console.error('Delete admin error:', error)
    return { error: '사용자 삭제 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin() {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { error } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (error) {
      console.error('Update last login error:', error)
      // Don't return error as this is not critical
    }

    return { success: true }
  } catch (error) {
    console.error('Update last login error:', error)
    // Don't return error as this is not critical
    return { success: true }
  }
}