import { Database } from './database.types'

// Survey Question Types
export type SurveyQuestion = Database['public']['Tables']['survey_questions']['Row'] & {
  survey_choices: SurveyChoice[]
  survey_images: SurveyImage[]
}

export type SurveyChoice = Database['public']['Tables']['survey_choices']['Row']
export type SurveyImage = Database['public']['Tables']['survey_images']['Row']

// Matching Session Types
export type MatchingSession = Database['public']['Tables']['matching_sessions']['Row']

export interface MatchingSessionCreate {
  session_token?: string
  user_id?: string | null
  responses: Record<string, any>
  subjective_text?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

// Photographer Profile Types
export type PhotographerProfile = Database['public']['Tables']['photographers']['Row'] & {
  photographer_profiles?: Database['public']['Tables']['photographer_profiles']['Row'] | null
  photographer_keywords?: PhotographerKeyword[]
}

export type PhotographerKeyword = Database['public']['Tables']['photographer_keywords']['Row']

// Matching Result Types
export type MatchingResult = Database['public']['Tables']['matching_results']['Row'] & {
  photographer?: PhotographerProfile
  photographer_profile?: Database['public']['Tables']['photographer_profiles']['Row']
}

// 4-Dimensional Score Interface
export interface FourDimensionalScore {
  style_emotion_score: number
  communication_psychology_score: number
  purpose_story_score: number
  companion_score: number
  keyword_bonus?: number
  total_score: number
}

// Survey Response Types
export interface SurveyResponse {
  question_key: string
  answer: string | string[] | null
}

export interface SurveyResponses {
  [questionKey: string]: string | string[] | null
}

// Question Type Enum
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  IMAGE_CHOICE = 'image_choice',
  TEXTAREA = 'textarea',
  MULTIPLE_CHOICE = 'multiple_choice'
}

// Weight Category Enum
export enum WeightCategory {
  STYLE_EMOTION = 'style_emotion',
  COMMUNICATION_PSYCHOLOGY = 'communication_psychology',
  PURPOSE_STORY = 'purpose_story',
  COMPANION = 'companion'
}

// Filter Options
export interface MatchingFilters {
  regions?: string[]
  price_min?: number
  price_max?: number
  companion_types?: string[]
  keywords?: string[]
}

// Session Token Generator
export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 15)
  return `session_${timestamp}_${randomStr}`
}

// API Response Types
export interface MatchingSessionResponse {
  success: boolean
  data?: MatchingSession
  error?: string
}

export interface MatchingResultsResponse {
  success: boolean
  data?: MatchingResult[]
  error?: string
}

export interface SurveyQuestionsResponse {
  success: boolean
  data?: SurveyQuestion[]
  error?: string
}