'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

type Admin = Tables<'admins'>
type AdminInsert = TablesInsert<'admins'>
type AdminUpdate = TablesUpdate<'admins'>

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

    // Check if user is admin
    const isAdmin = session.user.user_metadata?.user_type === 'admin'
    if (!isAdmin) {
      return { error: '관리자 권한이 없습니다.' }
    }

    // Get admin profile from admins table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      // If admin record doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newAdmin, error: createError } = await supabase
          .from('admins')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'Admin User',
            role: 'admin'
          })
          .select()
          .single()

        if (createError) {
          return { error: '관리자 프로필 생성 실패: ' + createError.message }
        }
        
        return { data: newAdmin }
      }
      
      return { error: '관리자 정보 조회 실패: ' + error.message }
    }

    return { data: admin }
  } catch (error) {
    console.error('Get current admin error:', error)
    return { error: '예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(data: Partial<AdminUpdate>) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: updatedAdmin, error } = await supabase
      .from('admins')
      .update({
        ...data,
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
      data: updatedAdmin
    }
  } catch (error) {
    console.error('Update admin profile error:', error)
    return { error: '프로필 업데이트 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Create new admin user (Super Admin only)
 */
export async function createAdmin(params: {
  email: string
  password: string
  name: string
  role?: 'admin' | 'super_admin'
  department?: string
  phone?: string
}) {
  try {
    const supabase = await createClient()
    
    // Check if current user is super admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return { error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    const { email, password, name, role = 'admin', department, phone } = params
    
    // Create Auth user
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

    // Create admin record
    const { data: adminData, error: adminError } = await supabaseService
      .from('admins')
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
        department,
        phone
      })
      .select()
      .single()

    if (adminError) {
      // Rollback auth user creation
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return { error: '관리자 정보 저장 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')
    
    return { 
      success: true, 
      message: '관리자가 성공적으로 생성되었습니다.',
      data: adminData
    }
  } catch (error) {
    console.error('Create admin error:', error)
    return { error: '관리자 생성 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Get all admins (Super Admin only)
 */
export async function getAllAdmins() {
  try {
    const supabase = await createClient()
    
    // Check if current user is super admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return { error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    const { data: admins, error } = await supabase
      .from('admins')
      .select('*')
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
 * Update admin (Super Admin only)
 */
export async function updateAdmin(adminId: string, data: Partial<AdminUpdate>) {
  try {
    const supabase = await createClient()
    
    // Check if current user is super admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return { error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    const { data: updatedAdmin, error } = await supabase
      .from('admins')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single()

    if (error) {
      return { error: '관리자 정보 업데이트 실패: ' + error.message }
    }

    revalidatePath('/admin/users')
    
    return { 
      success: true, 
      message: '관리자 정보가 성공적으로 업데이트되었습니다.',
      data: updatedAdmin
    }
  } catch (error) {
    console.error('Update admin error:', error)
    return { error: '관리자 정보 업데이트 중 예상치 못한 오류가 발생했습니다.' }
  }
}

/**
 * Delete admin (Super Admin only)
 */
export async function deleteAdmin(adminId: string) {
  try {
    const supabase = await createClient()
    
    // Check if current user is super admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: '인증되지 않은 사용자입니다.' }
    }

    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return { error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    // Prevent deleting self
    if (adminId === session.user.id) {
      return { error: '자신의 계정은 삭제할 수 없습니다.' }
    }

    // Delete auth user (this will cascade delete admin record)
    const { error: authError } = await supabaseService.auth.admin.deleteUser(adminId)
    
    if (authError) {
      return { error: '관리자 삭제 중 오류가 발생했습니다.' }
    }

    revalidatePath('/admin/users')
    
    return { 
      success: true, 
      message: '관리자가 성공적으로 삭제되었습니다.'
    }
  } catch (error) {
    console.error('Delete admin error:', error)
    return { error: '관리자 삭제 중 예상치 못한 오류가 발생했습니다.' }
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
      .from('admins')
      .update({
        last_login_at: new Date().toISOString()
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