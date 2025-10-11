/**
 * Matching Questions Server Actions
 * 매칭 질문 관리 관련 서버 액션
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { adminLogger } from '@/lib/logger'
import type { SurveyQuestion } from '@/types/matching.types'
import type { TablesUpdate } from '@/types/database.types'

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface EmbeddingStatus {
  total: number
  generated: number
  pending: number
}

/**
 * Load all survey questions with choices and images
 */
export async function getSurveyQuestionsWithDetails(): Promise<ApiResponse<SurveyQuestion[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('survey_questions')
      .select(`
        *,
        survey_choices(id, choice_label, choice_embedding),
        survey_images(id, image_label, image_embedding)
      `)
      .order('question_order')

    if (error) {
      adminLogger.error('Error fetching survey questions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: (data as SurveyQuestion[]) || [] }
  } catch (error) {
    adminLogger.error('Unexpected error in getSurveyQuestionsWithDetails:', error)
    return { success: false, error: 'Failed to fetch survey questions' }
  }
}

/**
 * Check embedding generation status
 */
export async function getEmbeddingStatus(): Promise<ApiResponse<EmbeddingStatus>> {
  try {
    const supabase = await createClient()

    // Check choices embeddings
    const { data: choices } = await supabase
      .from('survey_choices')
      .select('id, choice_embedding')

    const totalChoices = choices?.length || 0
    const generatedChoices = choices?.filter(c => c.choice_embedding).length || 0

    // Check images embeddings
    const { data: images } = await supabase
      .from('survey_images')
      .select('id, image_embedding')

    const totalImages = images?.length || 0
    const generatedImages = images?.filter(i => i.image_embedding).length || 0

    const status: EmbeddingStatus = {
      total: totalChoices + totalImages,
      generated: generatedChoices + generatedImages,
      pending: (totalChoices + totalImages) - (generatedChoices + generatedImages)
    }

    return { success: true, data: status }
  } catch (error) {
    adminLogger.error('Unexpected error in getEmbeddingStatus:', error)
    return { success: false, error: 'Failed to check embedding status' }
  }
}

/**
 * Update a survey question
 */
export async function updateSurveyQuestion(
  questionId: string,
  updates: TablesUpdate<'survey_questions'>
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('survey_questions')
      .update(updates)
      .eq('id', questionId)

    if (error) {
      adminLogger.error('Error updating survey question:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Survey question updated', { questionId })
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in updateSurveyQuestion:', error)
    return { success: false, error: 'Failed to update survey question' }
  }
}
