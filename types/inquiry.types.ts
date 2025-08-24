import { z } from "zod"

export const inquiryFormSchema = z.object({
  // Personal Info
  name: z.string().min(2, { message: "이름은 최소 2자 이상이어야 합니다." }),
  instagram_id: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  phone: z
    .string()
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, { message: "유효한 전화번호를 입력해주세요 (예: 010-1234-5678)" }),
  desired_date: z.date({ required_error: "날짜를 선택해주세요" }),
  selected_slot_id: z.string().optional(), // Add this field
  people_count: z.number().int().min(1).max(6, { message: "최대 6명까지 가능합니다." }),
  relationship: z.string().optional(),

  // Mood Keywords
  current_mood_keywords: z.array(z.string()).min(1, { message: "최소 하나의 현재 기분을 선택해주세요" }),
  desired_mood_keywords: z.array(z.string()).min(1, { message: "최소 하나의 원하는 기분을 선택해주세요" }),

  // Additional Info
  special_request: z.string().optional(),
  difficulty_note: z.string().optional(),

  // Final Questions (Step 4)
  conversation_preference: z.string().optional(),
  conversation_topics: z.string().optional(),
  favorite_music: z.string().optional(),
  shooting_meaning: z.string().optional(),
})

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>

export interface Category {
  id: string
  parent_id: string | null
  name: string
  depth: number
  path: string
  display_order: number | null
  is_active: boolean | null
  representative_image_url: string | null
  representative_image_id: string | null
  created_at: string | null
  updated_at: string | null
  place_recommendation: string | null
  male_clothing_recommendation: string | null
  female_clothing_recommendation: string | null
  accessories_recommendation: string | null
  representative_image?: {
    id: string
    storage_url: string
    thumbnail_url: string | null
  } | null
}

export interface MoodKeyword {
  id: string
  name: string
  type: "current_mood" | "desired_mood"
  display_order: number
}

export interface SelectionHistoryStep {
  level: number
  selected_id: string
  options: string[]
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
  selected_category_id?: string
  selection_path?: string[]
  status: "new" | "contacted" | "completed"
  created_at: string
  special_request?: string
  admin_note?: string
  place_recommendation?: string
  difficulty_note?: string
  // Final Questions (Step 4)
  conversation_preference?: string
  conversation_topics?: string
  favorite_music?: string
  shooting_meaning?: string
  categories?: {
    id: string
    name: string
    path: string
    representative_image_url?: string
    male_clothing_recommendation?: string
    female_clothing_recommendation?: string
    accessories_recommendation?: string
  }
  current_mood_keywords: {
    id: string
    name: string
  }[]
  desired_mood_keywords: {
    id: string
    name: string
  }[]
  selected_slot_id: {
    id: string
    date: string
    start_time: string
    end_time: string
  }
  selection_history?: {
    steps: {
      level: number
      selected_id: string
      options: string[]
    }[]
    completed_at: string
  }
}

