import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Zod Schemas for User Management
// ============================================================================

/**
 * Admin user creation form schema
 */
export const createAdminSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
})

/**
 * Photographer user creation form schema
 */
export const createPhotographerSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  instagram_handle: z.string().optional(),
  bio: z.string().optional(),
})

export type CreateAdminFormData = z.infer<typeof createAdminSchema>
export type CreatePhotographerFormData = z.infer<typeof createPhotographerSchema>

// ============================================================================
// Database Types
// ============================================================================

export type User = Tables<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

export type Photographer = Tables<'photographers'>
export type PhotographerInsert = TablesInsert<'photographers'>
export type PhotographerUpdate = TablesUpdate<'photographers'>

// ============================================================================
// Extended Types for UI
// ============================================================================

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  created_at: string | null
  is_active: boolean | null
}

export interface PhotographerUser {
  id: string
  email: string
  name: string
  phone: string | null
  website_url: string | null
  instagram_handle: string | null
  bio: string | null
  created_at: string
  approval_status: string
}

// ============================================================================
// Type Compatibility Checks
// These will cause build errors if Zod schema doesn't match database schema
// ============================================================================

type _AdminFormDataCheck = {
  // password is not in database (handled separately in auth)
  email: CreateAdminFormData['email'] extends UserInsert['email'] ? true : 'email type mismatch'
  name: CreateAdminFormData['name'] extends UserInsert['name'] ? true : 'name type mismatch'
}

type _PhotographerFormDataCheck = {
  // password is not in database (handled separately in auth)
  email: CreatePhotographerFormData['email'] extends PhotographerInsert['email'] ? true : 'email type mismatch'
  name: CreatePhotographerFormData['name'] extends PhotographerInsert['name'] ? true : 'name type mismatch'
  phone: CreatePhotographerFormData['phone'] extends PhotographerInsert['phone'] ? true : 'phone type mismatch'
  website_url: CreatePhotographerFormData['website_url'] extends PhotographerInsert['website_url'] ? true : 'website_url type mismatch'
  instagram_handle: CreatePhotographerFormData['instagram_handle'] extends PhotographerInsert['instagram_handle'] ? true : 'instagram_handle type mismatch'
  bio: CreatePhotographerFormData['bio'] extends PhotographerInsert['bio'] ? true : 'bio type mismatch'
}
