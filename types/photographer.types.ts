import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Database Types
// ============================================================================

export type Photographer = Tables<'photographers'>
export type PhotographerInsert = TablesInsert<'photographers'>
export type PhotographerUpdate = TablesUpdate<'photographers'>

export type PhotographerProfile = Tables<'photographer_profiles'>
export type PhotographerProfileInsert = TablesInsert<'photographer_profiles'>
export type PhotographerProfileUpdate = TablesUpdate<'photographer_profiles'>

// ============================================================================
// Photographer Profile Edit Form Schemas
// ============================================================================

// Basic profile information
export const photographerBasicInfoSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다'),
  bio: z.string().min(50, '자기소개는 최소 50자 이상 입력해주세요').max(1000, '최대 1000자까지 입력 가능합니다'),
  instagram_handle: z.string().optional(),
  website_url: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal('')),
  youtube_intro_url: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal('')),
})

export type PhotographerBasicInfoFormData = z.infer<typeof photographerBasicInfoSchema>

// Professional information
export const photographerProfessionalInfoSchema = z.object({
  years_experience: z.number().min(0, '경력은 0년 이상이어야 합니다').max(50, '경력은 50년 이하여야 합니다'),
  specialties: z.array(z.string()).min(1, '최소 하나의 전문 분야를 선택해주세요'),
  studio_location: z.string().min(1, '활동 지역을 선택해주세요'),
  equipment_info: z.string().optional(),
  directing_style: z.string().optional(),
  photography_approach: z.string().optional(),
  personality_type: z.string().optional(),
})

export type PhotographerProfessionalInfoFormData = z.infer<typeof photographerProfessionalInfoSchema>

// Pricing information
export const photographerPricingInfoSchema = z.object({
  price_range_min: z.number().min(0, '최소 가격은 0원 이상이어야 합니다').optional(),
  price_range_max: z.number().min(0, '최대 가격은 0원 이상이어야 합니다').optional(),
  price_description: z.string().max(500, '가격 설명은 최대 500자까지 입력 가능합니다').optional(),
}).refine(
  (data) => {
    if (data.price_range_min && data.price_range_max) {
      return data.price_range_min <= data.price_range_max
    }
    return true
  },
  {
    message: '최소 가격은 최대 가격보다 작거나 같아야 합니다',
    path: ['price_range_max'],
  }
)

export type PhotographerPricingInfoFormData = z.infer<typeof photographerPricingInfoSchema>

// Settlement/Banking information
export const photographerSettlementInfoSchema = z.object({
  bank_name: z.string().min(1, '은행명을 입력해주세요').optional(),
  bank_account: z.string().min(1, '계좌번호를 입력해주세요').optional(),
  account_holder: z.string().min(1, '예금주명을 입력해주세요').optional(),
})

export type PhotographerSettlementInfoFormData = z.infer<typeof photographerSettlementInfoSchema>

// ============================================================================
// Photographer 4D Profile Edit Schemas
// ============================================================================

export const photographer4DProfileSchema = z.object({
  // Style & Emotion (40% weight)
  style_emotion_description: z
    .string()
    .min(100, '스타일/감성 설명은 최소 100자 이상 입력해주세요')
    .max(1000, '최대 1000자까지 입력 가능합니다')
    .optional(),

  // Communication & Psychology (30% weight)
  communication_psychology_description: z
    .string()
    .min(100, '소통/심리 설명은 최소 100자 이상 입력해주세요')
    .max(1000, '최대 1000자까지 입력 가능합니다')
    .optional(),

  // Purpose & Story (20% weight)
  purpose_story_description: z
    .string()
    .min(100, '목적/스토리 설명은 최소 100자 이상 입력해주세요')
    .max(1000, '최대 1000자까지 입력 가능합니다')
    .optional(),

  // Companion (10% weight)
  companion_description: z
    .string()
    .min(100, '동행자 설명은 최소 100자 이상 입력해주세요')
    .max(1000, '최대 1000자까지 입력 가능합니다')
    .optional(),

  // Companion types and service regions
  companion_types: z.array(z.string()).min(1, '최소 하나의 동행자 유형을 선택해주세요'),
  service_regions: z.array(z.string()).min(1, '최소 하나의 서비스 지역을 선택해주세요'),

  // Pricing for matching
  price_min: z.number().min(0, '최소 가격은 0원 이상이어야 합니다'),
  price_max: z.number().min(0, '최대 가격은 0원 이상이어야 합니다'),
}).refine(
  (data) => data.price_min <= data.price_max,
  {
    message: '최소 가격은 최대 가격보다 작거나 같아야 합니다',
    path: ['price_max'],
  }
)

export type Photographer4DProfileFormData = z.infer<typeof photographer4DProfileSchema>

// ============================================================================
// Build-time Type Checks (Database와 Form 타입 일치 검증)
// ============================================================================

// 1. Basic Info Check
type _PhotographerBasicInfoCheck = {
  name: PhotographerBasicInfoFormData['name'] extends NonNullable<PhotographerUpdate['name']>
    ? true
    : 'name type mismatch - check photographers.name column type'

  email: PhotographerBasicInfoFormData['email'] extends NonNullable<PhotographerUpdate['email']>
    ? true
    : 'email type mismatch - check photographers.email column type'

  phone: PhotographerBasicInfoFormData['phone'] extends NonNullable<PhotographerUpdate['phone']>
    ? true
    : 'phone type mismatch - check photographers.phone column type'

  bio: PhotographerBasicInfoFormData['bio'] extends NonNullable<PhotographerUpdate['bio']>
    ? true
    : 'bio type mismatch - check photographers.bio column type'

  instagram_handle: PhotographerBasicInfoFormData['instagram_handle'] extends PhotographerUpdate['instagram_handle']
    ? true
    : 'instagram_handle type mismatch - check photographers.instagram_handle column type'

  website_url: NonNullable<PhotographerBasicInfoFormData['website_url']> extends NonNullable<PhotographerUpdate['website_url']>
    ? true
    : 'website_url type mismatch - check photographers.website_url column type'

  youtube_intro_url: NonNullable<PhotographerBasicInfoFormData['youtube_intro_url']> extends NonNullable<PhotographerUpdate['youtube_intro_url']>
    ? true
    : 'youtube_intro_url type mismatch - check photographers.youtube_intro_url column type'
}

// 2. Professional Info Check
type _PhotographerProfessionalInfoCheck = {
  years_experience: PhotographerProfessionalInfoFormData['years_experience'] extends NonNullable<PhotographerUpdate['years_experience']>
    ? true
    : 'years_experience type mismatch - check photographers.years_experience column type'

  specialties: PhotographerProfessionalInfoFormData['specialties'] extends NonNullable<PhotographerUpdate['specialties']>
    ? true
    : 'specialties type mismatch - check photographers.specialties column type'

  studio_location: PhotographerProfessionalInfoFormData['studio_location'] extends NonNullable<PhotographerUpdate['studio_location']>
    ? true
    : 'studio_location type mismatch - check photographers.studio_location column type'

  equipment_info: PhotographerProfessionalInfoFormData['equipment_info'] extends PhotographerUpdate['equipment_info']
    ? true
    : 'equipment_info type mismatch - check photographers.equipment_info column type'

  directing_style: PhotographerProfessionalInfoFormData['directing_style'] extends PhotographerUpdate['directing_style']
    ? true
    : 'directing_style type mismatch - check photographers.directing_style column type'

  photography_approach: PhotographerProfessionalInfoFormData['photography_approach'] extends PhotographerUpdate['photography_approach']
    ? true
    : 'photography_approach type mismatch - check photographers.photography_approach column type'

  personality_type: PhotographerProfessionalInfoFormData['personality_type'] extends PhotographerUpdate['personality_type']
    ? true
    : 'personality_type type mismatch - check photographers.personality_type column type'
}

// 3. Pricing Info Check
type _PhotographerPricingInfoCheck = {
  price_range_min: PhotographerPricingInfoFormData['price_range_min'] extends PhotographerUpdate['price_range_min']
    ? true
    : 'price_range_min type mismatch - check photographers.price_range_min column type'

  price_range_max: PhotographerPricingInfoFormData['price_range_max'] extends PhotographerUpdate['price_range_max']
    ? true
    : 'price_range_max type mismatch - check photographers.price_range_max column type'

  price_description: PhotographerPricingInfoFormData['price_description'] extends PhotographerUpdate['price_description']
    ? true
    : 'price_description type mismatch - check photographers.price_description column type'
}

// 4. Settlement Info Check
type _PhotographerSettlementInfoCheck = {
  bank_name: PhotographerSettlementInfoFormData['bank_name'] extends PhotographerUpdate['bank_name']
    ? true
    : 'bank_name type mismatch - check photographers.bank_name column type'

  bank_account: PhotographerSettlementInfoFormData['bank_account'] extends PhotographerUpdate['bank_account']
    ? true
    : 'bank_account type mismatch - check photographers.bank_account column type'

  account_holder: PhotographerSettlementInfoFormData['account_holder'] extends PhotographerUpdate['account_holder']
    ? true
    : 'account_holder type mismatch - check photographers.account_holder column type'
}

// 5. 4D Profile Check (photographer_profiles table)
type _Photographer4DProfileCheck = {
  style_emotion_description: Photographer4DProfileFormData['style_emotion_description'] extends PhotographerProfileUpdate['style_emotion_description']
    ? true
    : 'style_emotion_description type mismatch - check photographer_profiles.style_emotion_description column type'

  communication_psychology_description: Photographer4DProfileFormData['communication_psychology_description'] extends PhotographerProfileUpdate['communication_psychology_description']
    ? true
    : 'communication_psychology_description type mismatch - check photographer_profiles.communication_psychology_description column type'

  purpose_story_description: Photographer4DProfileFormData['purpose_story_description'] extends PhotographerProfileUpdate['purpose_story_description']
    ? true
    : 'purpose_story_description type mismatch - check photographer_profiles.purpose_story_description column type'

  companion_description: Photographer4DProfileFormData['companion_description'] extends PhotographerProfileUpdate['companion_description']
    ? true
    : 'companion_description type mismatch - check photographer_profiles.companion_description column type'

  companion_types: Photographer4DProfileFormData['companion_types'] extends NonNullable<PhotographerProfileUpdate['companion_types']>
    ? true
    : 'companion_types type mismatch - check photographer_profiles.companion_types column type'

  service_regions: Photographer4DProfileFormData['service_regions'] extends NonNullable<PhotographerProfileUpdate['service_regions']>
    ? true
    : 'service_regions type mismatch - check photographer_profiles.service_regions column type'

  price_min: Photographer4DProfileFormData['price_min'] extends NonNullable<PhotographerProfileUpdate['price_min']>
    ? true
    : 'price_min type mismatch - check photographer_profiles.price_min column type'

  price_max: Photographer4DProfileFormData['price_max'] extends NonNullable<PhotographerProfileUpdate['price_max']>
    ? true
    : 'price_max type mismatch - check photographer_profiles.price_max column type'
}
