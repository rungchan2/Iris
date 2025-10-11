'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Tables, TablesUpdate } from '@/types/database.types'
import { setUserCookie } from '@/lib/auth/cookie'

type User = Tables<'users'>

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get current user profile data
 */
export async function getUserProfile(): Promise<ApiResponse<User>> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update user profile (name and phone)
 */
export async function updateUserProfile(updates: {
  name?: string
  phone?: string
}): Promise<ApiResponse<User>> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized' }
    }

    const updateData: TablesUpdate<'users'> = {}

    if (updates.name !== undefined) {
      updateData.name = updates.name
    }

    if (updates.phone !== undefined) {
      updateData.phone = updates.phone
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Update auth cookie with new name
    if (updates.name) {
      await setUserCookie({
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name,
      })
    }

    revalidatePath('/user/profile')

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
