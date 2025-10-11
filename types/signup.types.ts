import { z } from 'zod'
import type { Tables, TablesInsert } from './database.types'

// ============================================================================
// Signup Form Schema
// ============================================================================

/**
 * User signup form schema with terms agreement
 */
export const userSignupSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  // Terms agreement
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: '이용약관에 동의해주세요',
  }),
  agreedToPrivacy: z.boolean().refine((val) => val === true, {
    message: '개인정보 처리방침에 동의해주세요',
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

export type UserSignupFormData = z.infer<typeof userSignupSchema>

/**
 * Photographer signup form schema with terms agreement
 */
export const photographerSignupSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  website_url: z.string().url('올바른 URL 형식이 아닙니다').optional().or(z.literal('')),
  instagram_handle: z.string().optional(),
  bio: z.string().optional(),
  // Terms agreement
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: '이용약관에 동의해주세요',
  }),
  agreedToPrivacy: z.boolean().refine((val) => val === true, {
    message: '개인정보 처리방침에 동의해주세요',
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

export type PhotographerSignupFormData = z.infer<typeof photographerSignupSchema>

// ============================================================================
// Terms Agreement Types
// ============================================================================

export interface TermsAgreement {
  agreedToTerms: boolean
  agreedToPrivacy: boolean
  agreedTermsId?: string
  agreedPrivacyId?: string
}

export interface ActiveTermsVersions {
  termsId: string | null
  privacyId: string | null
}

// ============================================================================
// Build-time Type Checks (Database와 Form 타입 일치 검증)
// ============================================================================

type UsersInsert = TablesInsert<'users'>
type PhotographersInsert = TablesInsert<'photographers'>

// 1. User Signup Schema Check
type _UserSignupDataCheck = {
  // Core fields that map to users table
  email: UserSignupFormData['email'] extends NonNullable<UsersInsert['email']>
    ? true
    : 'email type mismatch - check users.email column type'

  name: UserSignupFormData['name'] extends NonNullable<UsersInsert['name']>
    ? true
    : 'name type mismatch - check users.name column type'

  phone: UserSignupFormData['phone'] extends NonNullable<UsersInsert['phone']>
    ? true
    : 'phone type mismatch - check users.phone column type'

  // password and passwordConfirm are auth-only, not stored in users table
  // agreedToTerms and agreedToPrivacy map to boolean flags, verified separately
}

// 2. Photographer Signup Schema Check
type _PhotographerSignupDataCheck = {
  // Core fields that map to users table (photographers extend users)
  email: PhotographerSignupFormData['email'] extends NonNullable<UsersInsert['email']>
    ? true
    : 'email type mismatch - check users.email column type'

  name: PhotographerSignupFormData['name'] extends NonNullable<UsersInsert['name']>
    ? true
    : 'name type mismatch - check users.name column type'

  phone: PhotographerSignupFormData['phone'] extends NonNullable<UsersInsert['phone']>
    ? true
    : 'phone type mismatch - check users.phone column type'

  // Photographer-specific fields from photographers table
  website_url: NonNullable<PhotographerSignupFormData['website_url']> extends NonNullable<PhotographersInsert['website_url']>
    ? true
    : 'website_url type mismatch - check photographers.website_url column type'

  instagram_handle: PhotographerSignupFormData['instagram_handle'] extends PhotographersInsert['instagram_handle']
    ? true
    : 'instagram_handle type mismatch - check photographers.instagram_handle column type'

  bio: PhotographerSignupFormData['bio'] extends PhotographersInsert['bio']
    ? true
    : 'bio type mismatch - check photographers.bio column type'
}
