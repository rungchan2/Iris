import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Survey Question Types
// ============================================================================

export type SurveyQuestionDB = Tables<'survey_questions'>
export type SurveyQuestionInsert = TablesInsert<'survey_questions'>
export type SurveyQuestionUpdate = TablesUpdate<'survey_questions'>

// ============================================================================
// Survey Choice Types
// ============================================================================

export type SurveyChoiceDB = Tables<'survey_choices'>
export type SurveyChoiceInsert = TablesInsert<'survey_choices'>
export type SurveyChoiceUpdate = TablesUpdate<'survey_choices'>

// ============================================================================
// Survey Image Types
// ============================================================================

export type SurveyImageDB = Tables<'survey_images'>
export type SurveyImageInsert = TablesInsert<'survey_images'>
export type SurveyImageUpdate = TablesUpdate<'survey_images'>

// ============================================================================
// Combined Question Types
// ============================================================================

export interface QuestionWithChoicesAndImages extends SurveyQuestionDB {
  choices: SurveyChoiceDB[]
  images: SurveyImageDB[]
}

// ============================================================================
// Data Transfer Objects
// ============================================================================

export interface CreateChoiceData {
  choice_key: string
  choice_label: string
  choice_description?: string
  choice_order: number
  is_active?: boolean
}

export interface UpdateChoiceData {
  choice_key?: string
  choice_label?: string
  choice_description?: string
  choice_order?: number
  is_active?: boolean
}

export interface CreateSurveyImageData {
  image_key: string
  image_label: string
  image_description?: string
  image_url: string
  image_order: number
  is_active?: boolean
}

export interface UpdateSurveyImageData {
  image_key?: string
  image_label?: string
  image_description?: string
  image_url?: string
  image_order?: number
  is_active?: boolean
}
