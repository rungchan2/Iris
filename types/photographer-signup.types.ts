import { z } from 'zod'
import type { TablesInsert } from './database.types'

// =====================================
// Step 1: 기본 정보 (Auth + 가입 코드)
// =====================================
const step1BaseSchema = z.object({
  step1_email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  step1_name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다'),
  step1_password: z.string().min(6, '비밀번호는 최소 6글자 이상이어야 합니다'),
  step1_passwordConfirm: z.string().min(6, '비밀번호 확인을 입력해주세요'),
  step1_code: z.string().min(1, '가입 코드를 입력해주세요'),
})

export const photographerSignupStep1Schema = step1BaseSchema.refine(
  (data) => data.step1_password === data.step1_passwordConfirm,
  {
    message: '비밀번호가 일치하지 않습니다',
    path: ['step1_passwordConfirm'],
  }
)

export type PhotographerSignupStep1 = z.infer<typeof photographerSignupStep1Schema>

// =====================================
// Step 2: 연락처 및 개인정보
// =====================================
export const photographerSignupStep2Schema = z.object({
  step2_phone: z.string()
    .regex(/^[0-9-]+$/, '올바른 전화번호 형식을 입력해주세요')
    .min(1, '전화번호를 입력해주세요'),
  step2_gender: z.enum(['male', 'female', 'other']).optional(),
  step2_ageRange: z.string().optional(),
  step2_instagramHandle: z.string().optional(),
  step2_websiteUrl: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal('')),
})

export type PhotographerSignupStep2 = z.infer<typeof photographerSignupStep2Schema>

// =====================================
// Step 3: 전문 정보
// =====================================
export const photographerSignupStep3Schema = z.object({
  step3_yearsExperience: z.number()
    .min(0, '경력은 0년 이상이어야 합니다')
    .max(50, '경력은 50년 이하여야 합니다'),
  step3_specialties: z.array(z.string())
    .min(1, '최소 하나의 전문 분야를 선택해주세요'),
  step3_studioLocation: z.string().min(1, '활동 지역을 선택해주세요'),
  step3_equipmentInfo: z.string().optional(),
  step3_bio: z.string()
    .min(50, '자기소개는 최소 50자 이상 입력해주세요')
    .max(1000, '자기소개는 최대 1000자까지 입력 가능합니다'),
})

export type PhotographerSignupStep3 = z.infer<typeof photographerSignupStep3Schema>

// =====================================
// Step 4: 가격 정보
// =====================================
export const photographerSignupStep4Schema = z.object({
  step4_priceRangeMin: z.number().min(0, '최소 가격은 0원 이상이어야 합니다').optional(),
  step4_priceRangeMax: z.number().min(0, '최대 가격은 0원 이상이어야 합니다').optional(),
  step4_priceDescription: z.string().max(500, '가격 설명은 최대 500자까지 입력 가능합니다').optional(),
})

export type PhotographerSignupStep4 = z.infer<typeof photographerSignupStep4Schema>

// =====================================
// Step 5: 포트폴리오 및 약관 동의
// =====================================
export const photographerSignupStep5Schema = z.object({
  step5_portfolioFiles: z.array(z.instanceof(File))
    .min(3, '최소 3장의 포트폴리오 이미지를 업로드해주세요')
    .max(10, '최대 10장까지 업로드 가능합니다'),
  step5_portfolioDescriptions: z.array(z.string()).optional(),
  step5_agreeToTerms: z.boolean(),
  step5_agreeToPrivacy: z.boolean(),
})

export type PhotographerSignupStep5 = z.infer<typeof photographerSignupStep5Schema>

// =====================================
// 전체 Form Data (모든 단계 통합)
// =====================================
export const photographerSignupFormSchema = z.object({
  // Step 1
  ...step1BaseSchema.shape,
  // Step 2
  ...photographerSignupStep2Schema.shape,
  // Step 3
  ...photographerSignupStep3Schema.shape,
  // Step 4
  ...photographerSignupStep4Schema.shape,
  // Step 5
  ...photographerSignupStep5Schema.shape,
}).refine(
  (data) => data.step1_password === data.step1_passwordConfirm,
  {
    message: '비밀번호가 일치하지 않습니다',
    path: ['step1_passwordConfirm'],
  }
).refine(
  (data) => {
    if (data.step4_priceRangeMin && data.step4_priceRangeMax) {
      return data.step4_priceRangeMin <= data.step4_priceRangeMax
    }
    return true
  },
  {
    message: '최소 가격은 최대 가격보다 작거나 같아야 합니다',
    path: ['step4_priceRangeMax'],
  }
).refine(
  (data) => data.step5_agreeToTerms === true,
  {
    message: '이용약관에 동의해주세요',
    path: ['step5_agreeToTerms'],
  }
).refine(
  (data) => data.step5_agreeToPrivacy === true,
  {
    message: '개인정보처리방침에 동의해주세요',
    path: ['step5_agreeToPrivacy'],
  }
)

export type PhotographerSignupFormData = z.infer<typeof photographerSignupFormSchema>

// =====================================
// Database Insert 타입 (form → database 변환)
// =====================================
export type PhotographerInsertData = Omit<
  TablesInsert<'photographers'>,
  'created_at' | 'updated_at' | 'approval_status' | 'portfolio_submitted_at' | 'profile_completed'
> & {
  userId: string
}

// =====================================
// Build-time Type Checks (Database와 Form 타입 일치 검증)
// =====================================
type _PhotographerDataCheck = {
  // Step 1
  email: PhotographerSignupFormData['step1_email'] extends string ? true : 'email type mismatch'
  name: PhotographerSignupFormData['step1_name'] extends string ? true : 'name type mismatch'

  // Step 2
  phone: PhotographerSignupFormData['step2_phone'] extends string ? true : 'phone type mismatch'
  // gender, age_range: TEXT in DB (no validation needed)

  // Step 3
  years_experience: PhotographerSignupFormData['step3_yearsExperience'] extends number ? true : 'years_experience type mismatch'
  specialties: PhotographerSignupFormData['step3_specialties'] extends string[] ? true : 'specialties type mismatch'
  studio_location: PhotographerSignupFormData['step3_studioLocation'] extends string ? true : 'studio_location type mismatch'
  bio: PhotographerSignupFormData['step3_bio'] extends string ? true : 'bio type mismatch'

  // Step 4
  price_range_min: PhotographerSignupFormData['step4_priceRangeMin'] extends number | undefined ? true : 'price_range_min type mismatch'
  price_range_max: PhotographerSignupFormData['step4_priceRangeMax'] extends number | undefined ? true : 'price_range_max type mismatch'
}

// =====================================
// Form → Database 변환 헬퍼 함수
// =====================================
export function mapFormDataToPhotographerInsert(
  formData: PhotographerSignupFormData,
  userId: string
): PhotographerInsertData {
  return {
    userId,
    id: userId,
    email: formData.step1_email,
    name: formData.step1_name,
    phone: formData.step2_phone,
    gender: formData.step2_gender,
    age_range: formData.step2_ageRange,
    instagram_handle: formData.step2_instagramHandle,
    website_url: formData.step2_websiteUrl || undefined,
    years_experience: formData.step3_yearsExperience,
    specialties: formData.step3_specialties,
    studio_location: formData.step3_studioLocation,
    equipment_info: formData.step3_equipmentInfo,
    bio: formData.step3_bio,
    price_range_min: formData.step4_priceRangeMin,
    price_range_max: formData.step4_priceRangeMax,
    price_description: formData.step4_priceDescription,
  }
}
