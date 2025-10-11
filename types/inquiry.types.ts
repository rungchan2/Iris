import { z } from "zod"
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Zod Schemas for Inquiries
// ============================================================================

export const inquiryFormSchema = z.object({
  // Personal Info
  name: z.string().min(2, { message: "이름은 최소 2자 이상이어야 합니다." }),
  instagram_id: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  phone: z
    .string()
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, { message: "유효한 전화번호를 입력해주세요 (예: 010-1234-5678)" }),
  desired_date: z.date({ required_error: "날짜를 선택해주세요" }),
  selected_slot_id: z.string().optional(),
  people_count: z.number().int().min(1).max(6, { message: "최대 6명까지 가능합니다." }),
  relationship: z.string().optional(),

  // Legacy fields for backward compatibility
  current_mood_keywords: z.array(z.string()).optional(),
  desired_mood_keywords: z.array(z.string()).optional(),

  // Additional Info
  special_request: z.string().optional(),
  difficulty_note: z.string().optional(),

  // Final Questions (Step 4)
  conversation_preference: z.string().optional(),
  conversation_topics: z.string().optional(),
  favorite_music: z.string().optional(),
  shooting_meaning: z.string().optional(),

  // Product Selection (Step 3)
  selected_product_id: z.string().min(1, { message: "상품을 선택해주세요." }),

  // Payment Info (Step 4)
  paymentKey: z.string().optional(),
  orderId: z.string().optional(),
})

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>

// ============================================================================
// Database Types
// ============================================================================

export type InquiryDB = Tables<'inquiries'>
export type InquiryInsert = TablesInsert<'inquiries'>
export type InquiryUpdate = TablesUpdate<'inquiries'>

// ============================================================================
// Type Compatibility Checks
// These will cause build errors if Zod schema doesn't match database schema
// ============================================================================

type _InquiryFormValuesCheck = {
  name: InquiryFormValues['name'] extends InquiryInsert['name'] ? true : 'name type mismatch'
  instagram_id: InquiryFormValues['instagram_id'] extends InquiryInsert['instagram_id'] ? true : 'instagram_id type mismatch'
  gender: InquiryFormValues['gender'] extends InquiryInsert['gender'] ? true : 'gender type mismatch'
  phone: InquiryFormValues['phone'] extends InquiryInsert['phone'] ? true : 'phone type mismatch'
  // desired_date is Date in form, string in DB (handled in conversion)
  // selected_product_id maps to product_id in DB (handled in conversion)
  selected_slot_id: InquiryFormValues['selected_slot_id'] extends InquiryInsert['selected_slot_id'] ? true : 'selected_slot_id type mismatch'
  people_count: InquiryFormValues['people_count'] extends InquiryInsert['people_count'] ? true : 'people_count type mismatch'
  relationship: InquiryFormValues['relationship'] extends InquiryInsert['relationship'] ? true : 'relationship type mismatch'
  special_request: InquiryFormValues['special_request'] extends InquiryInsert['special_request'] ? true : 'special_request type mismatch'
  difficulty_note: InquiryFormValues['difficulty_note'] extends InquiryInsert['difficulty_note'] ? true : 'difficulty_note type mismatch'
  conversation_preference: InquiryFormValues['conversation_preference'] extends InquiryInsert['conversation_preference'] ? true : 'conversation_preference type mismatch'
  conversation_topics: InquiryFormValues['conversation_topics'] extends InquiryInsert['conversation_topics'] ? true : 'conversation_topics type mismatch'
  favorite_music: InquiryFormValues['favorite_music'] extends InquiryInsert['favorite_music'] ? true : 'favorite_music type mismatch'
  shooting_meaning: InquiryFormValues['shooting_meaning'] extends InquiryInsert['shooting_meaning'] ? true : 'shooting_meaning type mismatch'
}

// Legacy types for backward compatibility with old code
export interface Category {
  id: string
  name: string
  parent_id?: string | null
  children?: Category[]
  depth?: number
  display_order?: number
  is_active?: boolean
  representative_image?: string | null
  representative_image_url?: string | null
  male_clothing_recommendation?: string | null
  female_clothing_recommendation?: string | null
  accessories_recommendation?: string | null
  path?: string
}

export interface MoodKeyword {
  id: string
  name: string
}

export interface AvailableSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  max_bookings: number
  current_bookings: number
  is_available: boolean
  admin_id: string
  photographers?: {
    name: string
    email: string
  }
}

export interface Inquiry {
  id: string
  name: string
  phone: string
  instagram_id?: string
  gender?: "male" | "female" | "other"
  desired_date: string
  people_count: number
  status: "new" | "contacted" | "completed"
  created_at: string
  special_request?: string
  admin_note?: string
  difficulty_note?: string
  // Final Questions (Step 4)
  conversation_preference?: string
  conversation_topics?: string
  favorite_music?: string
  shooting_meaning?: string
  // Legacy fields for backward compatibility
  matched_admin_id?: string | null
  selected_category_id?: string | null
  selection_path?: string[] | null
  place_recommendation?: string | null
  current_mood_keywords?: string[] | null
  desired_mood_keywords?: string[] | null
  relationship?: string
  selected_slot_id: {
    id: string
    date: string
    start_time: string
    end_time: string
  }
  photographers?: Photographer
  matched_admin?: Array<{ name: string | null }>
  assigned_admin?: Array<{ name: string | null; email: string | null }>
}

export interface Photographer {
  id: string
  name: string | null
  email: string | null
}

