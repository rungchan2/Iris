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

  // Mood keywords and categories removed - no longer used

  // Additional Info
  special_request: z.string().optional(),
  difficulty_note: z.string().optional(),

  // Final Questions (Step 4)
  conversation_preference: z.string().optional(),
  conversation_topics: z.string().optional(),
  favorite_music: z.string().optional(),
  shooting_meaning: z.string().optional(),

  // Payment Info (Step 5)
  paymentKey: z.string().optional(),
  orderId: z.string().optional(),
})

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>

// Category interface removed - no longer using categories

// MoodKeyword interface removed - no longer using keywords table

// SelectionHistoryStep interface removed - no longer using tournament

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
  // categories field removed - no longer using categories
  // mood keywords and selection history removed - no longer used
  selected_slot_id: {
    id: string
    date: string
    start_time: string
    end_time: string
  }
}

